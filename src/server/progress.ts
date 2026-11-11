import { and, asc, count, desc, eq, inArray, isNotNull, lte } from "drizzle-orm";
import type { Difficulty } from "../../content/types";
import type { Q } from "../db/client";
import { assignments, attempts, problems, reviewItems, sections, type ReviewReason } from "../db/schema";
import { addDays } from "../lib/dates";
import { CONFIDENCE_SCORE, isSectionMastered, summarize, type ProblemStatus, type ProblemSummary } from "../lib/mastery";
import { LEVEL_ORDER, practiceLink, type Prep } from "../lib/prep";
import { ensureAssignments } from "./plan";
import { prepProblemIds } from "./prep";

export type SectionInfo = { id: string; title: string; objectives: string[]; sort: number };

export type AssignedProblem = {
  problemId: string;
  sectionId: string;
  position: number;
  difficulty: Difficulty;
  openstaxNumber: number | null;
  statement: string;
};

export type RatedRow = {
  attemptId: string;
  problemId: string;
  sectionId: string;
  difficulty: Difficulty;
  openstaxNumber: number | null;
  rating: "got_it" | "shaky" | "lost" | "skipped";
  ratedDay: string;
  ratedAt: Date;
  hintUsed: boolean;
  answerRevealed: boolean;
  solutionViewed: boolean;
};

export type PendingItem = {
  id: string;
  problemId: string;
  sourceProblemId: string | null;
  dueDate: string;
  reason: ReviewReason;
  sectionId: string;
  difficulty: Difficulty;
  openstaxNumber: number | null;
  statement: string;
};

export type StudentState = {
  sections: SectionInfo[];
  assigned: AssignedProblem[];
  rated: RatedRow[];
  summaries: Map<string, ProblemSummary>;
  pending: PendingItem[];
};

/** The Final Exam has no fixed plan: each chapter's list is all of its active questions, by level then number. */
async function finalLists(q: Q): Promise<AssignedProblem[]> {
  const rows = await q
    .select({
      problemId: problems.id,
      sectionId: problems.sectionId,
      difficulty: problems.difficulty,
      openstaxNumber: problems.openstaxNumber,
      statement: problems.statement,
      sort: problems.sort,
      sectionSort: sections.sort,
    })
    .from(problems)
    .innerJoin(sections, eq(sections.id, problems.sectionId))
    .where(and(eq(sections.preparation, "final"), eq(problems.active, true)));
  rows.sort((a, b) => a.sectionSort - b.sectionSort || LEVEL_ORDER[a.difficulty] - LEVEL_ORDER[b.difficulty] || a.sort - b.sort);
  const seen = new Map<string, number>();
  return rows.map((r) => {
    const position = (seen.get(r.sectionId) ?? 0) + 1;
    seen.set(r.sectionId, position);
    return { problemId: r.problemId, sectionId: r.sectionId, position, difficulty: r.difficulty, openstaxNumber: r.openstaxNumber, statement: r.statement };
  });
}

/** Everything the student pages need, in four queries, for one preparation. */
export async function loadStudentState(q: Q, studentId: string, prep: Prep = "exam4"): Promise<StudentState> {
  // The old fixed plans exist only for the Integration Review sections.
  if (prep === "exam4") await ensureAssignments(q, studentId);
  const mine = prepProblemIds(q, prep);
  const [secs, assigned, rated, pending] = await Promise.all([
    q
      .select({ id: sections.id, title: sections.title, objectives: sections.objectives, sort: sections.sort })
      .from(sections)
      // The supplementary sections (4.1, 4.2) aren't on Exam 4, so they stay out of these lists.
      .where(and(eq(sections.kind, "core"), eq(sections.preparation, prep)))
      .orderBy(asc(sections.sort)),
    prep === "final"
      ? finalLists(q)
      : q
          .select({
            problemId: assignments.problemId,
            sectionId: assignments.sectionId,
            position: assignments.position,
            difficulty: problems.difficulty,
            openstaxNumber: problems.openstaxNumber,
            statement: problems.statement,
          })
          .from(assignments)
          .innerJoin(problems, eq(problems.id, assignments.problemId))
          .where(and(eq(assignments.studentId, studentId), eq(problems.active, true)))
          .orderBy(asc(assignments.position)),
    q
      .select({
        attemptId: attempts.id,
        problemId: attempts.problemId,
        sectionId: problems.sectionId,
        difficulty: problems.difficulty,
        openstaxNumber: problems.openstaxNumber,
        rating: attempts.rating,
        ratedDay: attempts.ratedDay,
        ratedAt: attempts.ratedAt,
        hintUsed: attempts.hintUsed,
        answerRevealed: attempts.answerRevealed,
        solutionViewed: attempts.solutionViewed,
      })
      .from(attempts)
      .innerJoin(problems, eq(problems.id, attempts.problemId))
      .where(and(eq(attempts.studentId, studentId), isNotNull(attempts.ratedAt), inArray(attempts.problemId, mine)))
      .orderBy(desc(attempts.ratedAt)),
    q
      .select({
        id: reviewItems.id,
        problemId: reviewItems.problemId,
        sourceProblemId: reviewItems.sourceProblemId,
        dueDate: reviewItems.dueDate,
        reason: reviewItems.reason,
        sectionId: problems.sectionId,
        difficulty: problems.difficulty,
        openstaxNumber: problems.openstaxNumber,
        statement: problems.statement,
      })
      .from(reviewItems)
      .innerJoin(problems, eq(problems.id, reviewItems.problemId))
      .where(and(eq(reviewItems.studentId, studentId), eq(reviewItems.status, "pending"), inArray(reviewItems.problemId, mine)))
      .orderBy(asc(reviewItems.dueDate), asc(reviewItems.createdAt)),
  ]);
  const ratedRows = rated.map((r) => ({ ...r, rating: r.rating!, ratedDay: r.ratedDay!, ratedAt: r.ratedAt! }));
  return {
    sections: secs,
    assigned,
    rated: ratedRows,
    summaries: summarize(ratedRows),
    pending,
  };
}

export type SectionProgress = {
  section: SectionInfo;
  total: number;
  done: number;
  percent: number;
  counts: Record<Difficulty, number>;
  ratings: { got_it: number; shaky: number; lost: number; new: number; mastered: number };
  mastered: boolean;
  nextProblemId: string | null;
};

export function sectionProgress(state: StudentState): SectionProgress[] {
  return state.sections.map((section) => {
    const list = state.assigned.filter((a) => a.sectionId === section.id);
    const counts: Record<Difficulty, number> = { F: 0, C: 0, Ch: 0 };
    const ratings = { got_it: 0, shaky: 0, lost: 0, new: 0, mastered: 0 };
    let done = 0;
    for (const a of list) {
      counts[a.difficulty]++;
      const s = state.summaries.get(a.problemId);
      if (!s || !s.latest || s.latest === "skipped") ratings.new++;
      else {
        done++;
        if (s.latest === "got_it") ratings.got_it++;
        if (s.latest === "shaky") ratings.shaky++;
        if (s.latest === "lost") ratings.lost++;
        if (s.status === "mastered") ratings.mastered++;
      }
    }
    return {
      section,
      total: list.length,
      done,
      percent: list.length ? Math.round((done / list.length) * 100) : 0,
      counts,
      ratings,
      mastered: isSectionMastered(
        list.map((a) => a.problemId),
        state.summaries,
      ),
      nextProblemId: list.find((a) => !state.summaries.has(a.problemId))?.problemId ?? null,
    };
  });
}

export type Recommendation =
  | { kind: "easier"; href: string; problemId: string; sectionId: string; sectionTitle: string; difficulty: Difficulty; done: number; total: number }
  | { kind: "plan"; href: string; problemId: string; sectionId: string; sectionTitle: string; difficulty: Difficulty; position: number; done: number; total: number }
  | { kind: "review"; href: string; problemId: string; sectionId: string; sectionTitle: string; difficulty: Difficulty; dueCount: number }
  | { kind: "done" };

export function recommend(state: StudentState, today: string, prep: Prep = "exam4"): Recommendation {
  const progress = sectionProgress(state);
  const title = (id: string) => state.sections.find((s) => s.id === id)?.title ?? id;
  const easier = state.pending.find((i) => i.reason === "easier" && i.dueDate <= today);
  if (easier) {
    const p = progress.find((x) => x.section.id === easier.sectionId);
    return {
      kind: "easier",
      href: practiceLink(prep, easier.problemId, { item: easier.id }),
      problemId: easier.problemId,
      sectionId: easier.sectionId,
      sectionTitle: title(easier.sectionId),
      difficulty: easier.difficulty,
      done: p?.done ?? 0,
      total: p?.total ?? 0,
    };
  }
  for (const p of progress) {
    if (!p.nextProblemId) continue;
    const a = state.assigned.find((x) => x.problemId === p.nextProblemId)!;
    const position = state.assigned.filter((x) => x.sectionId === p.section.id).findIndex((x) => x.problemId === a.problemId) + 1;
    return {
      kind: "plan",
      href: practiceLink(prep, a.problemId),
      problemId: a.problemId,
      sectionId: p.section.id,
      sectionTitle: p.section.title,
      difficulty: a.difficulty,
      position,
      done: p.done,
      total: p.total,
    };
  }
  const due = state.pending.filter((i) => i.dueDate <= today);
  if (due.length > 0) {
    return {
      kind: "review",
      href: practiceLink(prep, due[0].problemId, { item: due[0].id }),
      problemId: due[0].problemId,
      sectionId: due[0].sectionId,
      sectionTitle: title(due[0].sectionId),
      difficulty: due[0].difficulty,
      dueCount: due.length,
    };
  }
  return { kind: "done" };
}

export type DashboardStats = {
  completed: number;
  sectionsMastered: number;
  toReview: number;
  dueNow: number;
  dueLater: number;
};

export function dashboardStats(state: StudentState, today: string): DashboardStats {
  let toReview = 0;
  for (const s of state.summaries.values()) if (s.latest === "shaky" || s.latest === "lost") toReview++;
  const progress = sectionProgress(state);
  return {
    completed: state.summaries.size,
    sectionsMastered: progress.filter((p) => p.mastered).length,
    toReview,
    dueNow: state.pending.filter((i) => i.dueDate <= today).length,
    dueLater: state.pending.filter((i) => i.dueDate > today).length,
  };
}

export type QueueGroup = { key: "overdue" | "today" | "tomorrow" | "later"; label: string; items: Array<PendingItem & { lastRating: ProblemSummary["latest"]; lastRatedAt: Date | null }> };

export function reviewGroups(state: StudentState, today: string): QueueGroup[] {
  const groups: QueueGroup[] = [
    { key: "overdue", label: "Overdue", items: [] },
    { key: "today", label: "Due today", items: [] },
    { key: "tomorrow", label: "Tomorrow", items: [] },
    { key: "later", label: "Coming up", items: [] },
  ];
  const tomorrow = addDays(today, 1);
  for (const item of state.pending) {
    const s = state.summaries.get(item.problemId);
    const row = { ...item, lastRating: s?.latest ?? null, lastRatedAt: s?.latestAt ?? null };
    if (item.dueDate < today) groups[0].items.push(row);
    else if (item.dueDate === today) groups[1].items.push(row);
    else if (item.dueDate === tomorrow) groups[2].items.push(row);
    else groups[3].items.push(row);
  }
  return groups;
}

export type ProgressReport = {
  attempted: number;
  ratingsGiven: number;
  latest: { got_it: number; shaky: number; lost: number };
  gotItPercent: number;
  confidence: number | null;
  helpPercent: number;
  weakest: Array<{ section: SectionInfo; shaky: number; lost: number }>;
  activity: Array<{ day: string; count: number }>;
};

export function progressReport(state: StudentState, today: string): ProgressReport {
  const latest = { got_it: 0, shaky: 0, lost: 0 };
  let scoreSum = 0;
  for (const s of state.summaries.values()) {
    if (s.latest === "got_it" || s.latest === "shaky" || s.latest === "lost") {
      latest[s.latest]++;
      scoreSum += CONFIDENCE_SCORE[s.latest];
    }
  }
  const latestTotal = latest.got_it + latest.shaky + latest.lost;
  const helped = state.rated.filter((r) => r.hintUsed || r.answerRevealed || r.solutionViewed).length;
  const weakest = sectionProgress(state)
    .map((p) => ({ section: p.section, shaky: p.ratings.shaky, lost: p.ratings.lost }))
    .filter((w) => w.shaky + w.lost > 0)
    .sort((a, b) => b.lost * 2 + b.shaky - (a.lost * 2 + a.shaky))
    .slice(0, 3);
  const activity: Array<{ day: string; count: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const day = addDays(today, -i);
    activity.push({ day, count: state.rated.filter((r) => r.ratedDay === day).length });
  }
  return {
    attempted: state.summaries.size,
    ratingsGiven: state.rated.length,
    latest,
    gotItPercent: latestTotal ? Math.round((latest.got_it / latestTotal) * 100) : 0,
    confidence: latestTotal ? Math.round((scoreSum / latestTotal) * 10) / 10 : null,
    helpPercent: state.rated.length ? Math.round((helped / state.rated.length) * 100) : 0,
    weakest,
    activity,
  };
}

export type SectionDetail = {
  progress: SectionProgress;
  problems: Array<AssignedProblem & { status: ProblemStatus; index: number }>;
  extras: Array<{ problemId: string; openstaxNumber: number | null; difficulty: Difficulty; status: ProblemStatus }>;
};

export function sectionDetail(state: StudentState, sectionId: string): SectionDetail | null {
  const progress = sectionProgress(state).find((p) => p.section.id === sectionId);
  if (!progress) return null;
  const list = state.assigned.filter((a) => a.sectionId === sectionId);
  const assignedIds = new Set(list.map((a) => a.problemId));
  const extras = new Map<string, SectionDetail["extras"][number]>();
  for (const r of state.rated) {
    if (r.sectionId !== sectionId || assignedIds.has(r.problemId) || extras.has(r.problemId)) continue;
    extras.set(r.problemId, {
      problemId: r.problemId,
      openstaxNumber: r.openstaxNumber,
      difficulty: r.difficulty,
      status: state.summaries.get(r.problemId)?.status ?? "new",
    });
  }
  return {
    progress,
    problems: list.map((a, i) => ({ ...a, index: i + 1, status: state.summaries.get(a.problemId)?.status ?? "new" })),
    extras: [...extras.values()],
  };
}

/** One preparation's review problems due today or earlier (the sidebar badge). */
export async function dueReviewCount(q: Q, studentId: string, today: string, prep: Prep = "exam4"): Promise<number> {
  const [row] = await q
    .select({ n: count() })
    .from(reviewItems)
    .where(
      and(
        eq(reviewItems.studentId, studentId),
        eq(reviewItems.status, "pending"),
        lte(reviewItems.dueDate, today),
        inArray(reviewItems.problemId, prepProblemIds(q, prep)),
      ),
    );
  return row?.n ?? 0;
}

import { and, asc, desc, eq, inArray, isNotNull, isNull, lte, sql } from "drizzle-orm";
import type { DB, Q } from "../db/client";
import {
  assignments,
  attempts,
  notes,
  problemChecks,
  problems,
  problemTimeStats,
  reviewItems,
  sections,
  sessionItems,
  studySessions,
  students,
  type Attempt,
  type Problem,
  type Rating,
  type ReviewItem,
  type SessionItem,
} from "../db/schema";
import { todayISO } from "../lib/dates";
import { computeModel } from "../lib/engine";
import { baseMinutes, usableSeconds } from "../lib/estimates";
import { supersededReviewIds } from "../lib/learning-state";
import { summarize, type ProblemStatus } from "../lib/mastery";
import { pickLookbackProblem } from "../lib/regressive";
import { followUpsToClose, ratingMessage, scheduleAfterRating, type ScheduledRating } from "../lib/scheduler";
import { DEFAULT_RULES } from "../lib/rules";
import { overflowToDrop, type PlannedItem } from "../lib/session-builder";
import { difficultyToLevel, neighbors, nextUnchecked, planHref } from "../lib/checklist";
import { type Prep, practiceLink, routesFor } from "../lib/prep";
import { loadChecks } from "./checklist";
import { loadStudentModel } from "./model";
import { prepOfSection, prepProblemIds } from "./prep";
import { completeIfDone, insertItemsAfter, nextEssential, nextOptional, practiceHref, sessionItemsOf, TRACK_ORIGIN } from "./sessions";

export class PracticeError extends Error {
  constructor(public code: "not_found" | "invalid") {
    super(code);
  }
}

export type AttemptState = Pick<Attempt, "id" | "hintUsed" | "hintsShown" | "answerRevealed" | "solutionViewed" | "rating">;

export async function getProblem(q: Q, id: string): Promise<Problem | undefined> {
  const [row] = await q.select().from(problems).where(eq(problems.id, id));
  return row;
}

/** Returns the student's open attempt at this problem, creating it if needed (idempotent). */
export async function openAttempt(
  q: Q,
  studentId: string,
  problemId: string,
  opts: { origin: "plan" | "review" | "browse"; reviewItemId?: string | null; sessionItemId?: string | null },
): Promise<AttemptState> {
  const problem = await getProblem(q, problemId);
  if (!problem) throw new PracticeError("not_found");

  // A study-session item links the attempt to today's plan; its track sets the origin.
  let item: SessionItem | null = null;
  if (opts.sessionItemId) {
    const [row] = await q
      .select()
      .from(sessionItems)
      .where(and(eq(sessionItems.id, opts.sessionItemId), eq(sessionItems.studentId, studentId), eq(sessionItems.problemId, problemId)));
    item = row && row.status !== "done" && row.status !== "skipped" ? row : null;
  }

  let reviewItemId: string | null = null;
  const wantedReview = opts.reviewItemId ?? item?.reviewItemId ?? null;
  if (wantedReview) {
    const [r] = await q
      .select({ id: reviewItems.id })
      .from(reviewItems)
      .where(and(eq(reviewItems.id, wantedReview), eq(reviewItems.studentId, studentId), eq(reviewItems.problemId, problemId)));
    reviewItemId = r?.id ?? null;
  }
  const origin = item ? TRACK_ORIGIN[item.track] : reviewItemId ? "review" : opts.origin === "review" ? "browse" : opts.origin;
  await q.insert(attempts).values({ studentId, problemId, origin, reviewItemId, sessionItemId: item?.id ?? null }).onConflictDoNothing();
  const [open] = await q
    .select()
    .from(attempts)
    .where(and(eq(attempts.studentId, studentId), eq(attempts.problemId, problemId), isNull(attempts.ratedAt)));
  if ((reviewItemId && open.reviewItemId !== reviewItemId) || (item && open.sessionItemId !== item.id)) {
    await q
      .update(attempts)
      .set({ reviewItemId: reviewItemId ?? open.reviewItemId, sessionItemId: item?.id ?? open.sessionItemId, origin })
      .where(eq(attempts.id, open.id));
  }
  if (item && (item.status !== "active" || item.attemptId !== open.id)) {
    await q.update(sessionItems).set({ status: "active", attemptId: open.id }).where(eq(sessionItems.id, item.id));
  }
  // Opening a problem from a paused session picks the session up again.
  if (item) {
    await q
      .update(studySessions)
      .set({ status: "active" })
      .where(and(eq(studySessions.id, item.sessionId), eq(studySessions.status, "paused")));
  }
  return {
    id: open.id,
    hintUsed: open.hintUsed,
    hintsShown: open.hintsShown,
    answerRevealed: open.answerRevealed,
    solutionViewed: open.solutionViewed,
    rating: open.rating,
  };
}

/** The most one save can add (the browser saves about every 2 minutes) and the most one attempt holds. */
export const MAX_SECONDS_PER_SAVE = DEFAULT_RULES.timing.maxSecondsPerSave;
export const MAX_ATTEMPT_SECONDS = 4 * 3600;

/** Whole, non-negative seconds, capped (anything odd counts as 0). */
export function cleanSeconds(raw: unknown, max = MAX_SECONDS_PER_SAVE): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(max, Math.round(n));
}

/** Adds on-screen time to an open attempt (the quiet timer). Ignored once the attempt is rated. */
export async function addAttemptTime(q: Q, studentId: string, attemptId: string, seconds: number): Promise<void> {
  const s = cleanSeconds(seconds);
  if (s === 0) return;
  await q
    .update(attempts)
    .set({ activeSeconds: sql`least(${attempts.activeSeconds} + ${s}, ${MAX_ATTEMPT_SECONDS})` })
    .where(and(eq(attempts.id, attemptId), eq(attempts.studentId, studentId), isNull(attempts.ratedAt)));
}

export type AssistKind = "hint" | "answer" | "solution";

/** Logs that help was used (design doc §4.4). Ignored once the attempt is rated. */
export async function recordAssist(q: Q, studentId: string, attemptId: string, kind: AssistKind, hintsShown = 1): Promise<void> {
  const where = and(eq(attempts.id, attemptId), eq(attempts.studentId, studentId), isNull(attempts.ratedAt));
  const [row] = await q.select({ hintsShown: attempts.hintsShown }).from(attempts).where(where);
  if (!row) return;
  if (kind === "hint") {
    await q.update(attempts).set({ hintUsed: true, hintsShown: Math.max(row.hintsShown, Math.min(hintsShown, 20)) }).where(where);
  } else if (kind === "answer") {
    await q.update(attempts).set({ answerRevealed: true }).where(where);
  } else {
    await q.update(attempts).set({ solutionViewed: true }).where(where);
  }
}

export type RateOutcome = {
  rating: Rating;
  message: string;
  nextHref: string;
  nextLabel: string;
  dueDate: string | null;
  alreadyRated: boolean;
  /** Inside a study session: whether the planned part is now finished. */
  sessionComplete?: boolean;
};

/**
 * Records a confidence rating and what follows from it: targeted reinforcement after Shaky and Lost,
 * closing follow-ups that are no longer needed, and class timing. Inside a study session it also
 * inserts an easier problem right away after a Lost and a bridge look-back once a new unit is under
 * way, then moves planned new problems to next time if those insertions run past the session length.
 */
export async function rateAttempt(
  db: DB,
  studentId: string,
  attemptId: string,
  rating: ScheduledRating,
  now = new Date(),
  opts: { seconds?: number } = {},
): Promise<RateOutcome> {
  return db.transaction(async (tx) => {
    const [attempt] = await tx.select().from(attempts).where(and(eq(attempts.id, attemptId), eq(attempts.studentId, studentId)));
    if (!attempt) throw new PracticeError("not_found");
    const problem = await getProblem(tx, attempt.problemId);
    if (!problem) throw new PracticeError("not_found");
    const today = todayISO(now);
    // The problem's preparation: everything after the rating stays inside it (its plan, its pages).
    const prep: Prep = (await prepOfSection(tx, problem.sectionId)) ?? "exam4";

    if (attempt.ratedAt && attempt.rating) {
      const next = attempt.sessionItemId
        ? await nextInSession(tx, studentId, attempt.sessionItemId, prep)
        : await nextAfter(tx, { studentId, problem, attempt, today, easierItem: null, prep });
      return { rating: attempt.rating, message: "Your rating was already saved.", ...next, dueDate: attempt.nextReviewDate, alreadyRated: true };
    }

    const activeSeconds = Math.min(MAX_ATTEMPT_SECONDS, attempt.activeSeconds + cleanSeconds(opts.seconds));
    const [pool, rated, assigned, answering] = await Promise.all([
      tx
        .select({ id: problems.id, difficulty: problems.difficulty, concepts: problems.concepts, sort: problems.sort })
        .from(problems)
        .where(and(eq(problems.sectionId, problem.sectionId), eq(problems.active, true))),
      tx
        .selectDistinct({ problemId: attempts.problemId })
        .from(attempts)
        .where(and(eq(attempts.studentId, studentId), isNotNull(attempts.ratedAt))),
      // The old fixed plans only matter outside a study session (until the old pages are retired).
      attempt.sessionItemId
        ? Promise.resolve([] as Array<{ problemId: string }>)
        : tx.select({ problemId: assignments.problemId }).from(assignments).where(eq(assignments.studentId, studentId)),
      attempt.reviewItemId
        ? tx.select({ reason: reviewItems.reason }).from(reviewItems).where(eq(reviewItems.id, attempt.reviewItemId))
        : Promise.resolve([] as Array<{ reason: ReviewItem["reason"] }>),
    ]);
    const attemptedBefore = new Set(rated.map((r) => r.problemId));

    // Any pending review of this problem is answered by this rating.
    await tx
      .update(reviewItems)
      .set({ status: "done", doneAt: now })
      .where(and(eq(reviewItems.studentId, studentId), eq(reviewItems.problemId, problem.id), eq(reviewItems.status, "pending")));
    let pending = await tx
      .select({ id: reviewItems.id, problemId: reviewItems.problemId, sourceProblemId: reviewItems.sourceProblemId, reason: reviewItems.reason })
      .from(reviewItems)
      .where(and(eq(reviewItems.studentId, studentId), eq(reviewItems.status, "pending")));

    // A clean Got it (no worked solution) also closes the similar or easier problems made from it.
    if (rating === "got_it" && !attempt.solutionViewed) {
      const close = followUpsToClose(pending, problem.id);
      if (close.length > 0) {
        await tx.update(reviewItems).set({ status: "done", doneAt: now }).where(inArray(reviewItems.id, close));
        pending = pending.filter((r) => !close.includes(r.id));
      }
    }

    // Inside a session, follow-ups also avoid problems already planned for later in it.
    const [item] = attempt.sessionItemId
      ? await tx
          .select()
          .from(sessionItems)
          .where(and(eq(sessionItems.id, attempt.sessionItemId), eq(sessionItems.studentId, studentId)))
      : [];
    const planned = item
      ? (await sessionItemsOf(tx, item.sessionId)).filter((i) => i.id !== item.id && (i.status === "pending" || i.status === "active")).map((i) => i.problemId)
      : [];
    const result = scheduleAfterRating({
      rating,
      problem: { id: problem.id, difficulty: problem.difficulty, concepts: problem.concepts, sort: problem.sort },
      pool,
      today,
      attempted: attemptedBefore,
      pending: new Set([...pending.map((r) => r.problemId), ...planned]),
      assigned: new Set(assigned.map((r) => r.problemId)),
      seed: studentId,
      // One easier problem per Lost: after a Lost on an easier problem, the next one waits a day.
      immediateEasier: answering[0]?.reason !== "easier",
    });
    const created =
      result.items.length > 0
        ? await tx
            .insert(reviewItems)
            .values(result.items.map((i) => ({ studentId, ...i })))
            .onConflictDoNothing()
            .returning()
        : [];
    const own = result.items.find((i) => i.problemId === problem.id) ?? null;
    await tx
      .update(attempts)
      .set({ rating, ratedAt: now, ratedDay: today, nextReviewDate: own?.dueDate ?? null, activeSeconds })
      .where(eq(attempts.id, attempt.id));
    // Rating a problem ticks it on the Study Plan.
    await tx.insert(problemChecks).values({ studentId, problemId: problem.id, checkedAt: now }).onConflictDoNothing();
    const easierItem = result.nextProblemId ? (created.find((c) => c.problemId === result.nextProblemId) ?? null) : null;

    // The planner's view after this rating.
    const [student] = await tx.select().from(students).where(eq(students.id, studentId));
    const loaded = await loadStudentModel(tx, student, now, prep);
    let model = loaded.model;

    // Class timing, from each student's first try at a problem (later tries are faster).
    if (!attemptedBefore.has(problem.id)) {
      const usable = usableSeconds(activeSeconds, baseMinutes(problem, loaded.rules), loaded.rules);
      if (usable !== null) {
        await tx
          .insert(problemTimeStats)
          .values({ problemId: problem.id, n: 1, sumLogSeconds: Math.log(usable) })
          .onConflictDoUpdate({
            target: problemTimeStats.problemId,
            set: { n: sql`${problemTimeStats.n} + 1`, sumLogSeconds: sql`${problemTimeStats.sumLogSeconds} + excluded.sum_log_seconds`, updatedAt: now },
          });
      }
    }

    // Reinforcement on skills the student has now demonstrated isn't needed any more.
    const superseded = supersededReviewIds(model.state, model.input.reviews, model.input.problems);
    if (superseded.length > 0) {
      await tx.update(reviewItems).set({ status: "done", doneAt: now }).where(inArray(reviewItems.id, superseded));
      const gone = new Set(superseded);
      model = computeModel({ ...model.input, reviews: model.input.reviews.filter((r) => !gone.has(r.id)) });
    }

    const message = ratingMessage(rating, easierItem ? result : { ...result, nextProblemId: null }, { solutionViewed: attempt.solutionViewed });
    const base = { rating, message, dueDate: own?.dueDate ?? null, alreadyRated: false };

    if (!item) return { ...base, ...(await nextAfter(tx, { studentId, problem, attempt, today, easierItem, prep })) };

    // ---- inside a study session
    await tx.update(sessionItems).set({ status: "done", doneAt: now, attemptId: attempt.id }).where(eq(sessionItems.id, item.id));
    const [session] = await tx.select().from(studySessions).where(eq(studySessions.id, item.sessionId));
    let items = await sessionItemsOf(tx, item.sessionId);
    const insert: PlannedItem[] = [];
    if (easierItem) {
      insert.push({
        track: "reinforcement",
        problemId: easierItem.problemId,
        reviewItemId: easierItem.id,
        reason: { code: "reinforce_easier" },
        minutes: model.personal(easierItem.problemId),
        essential: item.essential,
      });
    }
    // A bridge look-back becomes due after the first problems in a new unit.
    const bridge = model.lookbacks.due.find((u) => u.bridge);
    const lookbackAhead = items.some((i) => i.position > item.position && i.track === "lookback" && (i.status === "pending" || i.status === "active"));
    if (bridge && model.lookbacks.remainingToday > 0 && !lookbackAhead && session.status !== "completed" && item.essential) {
      const pick = pickLookbackProblem({
        unitId: bridge.unitId,
        today,
        units: model.input.units,
        problems: model.input.problems,
        state: model.state,
        reviews: model.input.reviews,
        rules: loaded.rules,
        seed: studentId,
        currentUnitId: model.plan.currentUnitId,
        personal: model.personal,
        maxMinutes: Number.POSITIVE_INFINITY,
        taken: new Set([...items.map((i) => i.problemId), ...insert.map((i) => i.problemId)]),
        ticked: model.input.ticked,
      });
      if (pick) insert.push({ track: "lookback", problemId: pick.problemId, reviewItemId: null, reason: bridge.reason, minutes: pick.minutes, essential: true });
    }
    if (insert.length > 0) {
      await insertItemsAfter(tx, session, item.position, insert);
      items = await sessionItemsOf(tx, item.sessionId);
      // Insertions can push the plan past the session length: move pending new problems to next time.
      const idx = items.findIndex((i) => i.id === item.id);
      const after = items.slice(idx + 1).filter((i) => i.essential && i.status === "pending");
      const plannedDone = items
        .slice(0, idx + 1)
        .filter((i) => i.essential)
        .reduce((m, i) => m + i.minutes, 0);
      const drop = overflowToDrop(after, plannedDone, session.budgetMinutes * (1 + loaded.rules.tolerance)).map((d) => after[d].id);
      if (drop.length > 0) {
        await tx.update(sessionItems).set({ status: "dropped" }).where(inArray(sessionItems.id, drop));
        items = items.map((i) => (drop.includes(i.id) ? { ...i, status: "dropped" as const } : i));
      }
    }
    const sessionComplete = await completeIfDone(tx, item.sessionId, now);
    return { ...base, ...nextFromItems(items, item, easierItem !== null, prep), sessionComplete };
  });
}

/** Where Continue goes inside a session: the next planned item, else the next optional one, else the summary. */
function nextFromItems(items: SessionItem[], current: SessionItem, easierNext: boolean, prep: Prep): { nextHref: string; nextLabel: string } {
  const next = current.essential ? nextEssential(items) : nextOptional(items.filter((i) => i.position > current.position));
  if (!next) return { nextHref: routesFor(prep).session, nextLabel: current.essential ? "See today's session" : "Back to today's session" };
  if (easierNext && next.track === "reinforcement") return { nextHref: practiceHref(next, prep), nextLabel: "Try an easier problem" };
  const label = next.track === "lookback" ? "Next: a look-back" : next.track === "reinforcement" ? "Next: reinforcement" : "Next problem";
  return { nextHref: practiceHref(next, prep), nextLabel: label };
}

async function nextInSession(q: Q, studentId: string, sessionItemId: string, prep: Prep): Promise<{ nextHref: string; nextLabel: string }> {
  const [item] = await q
    .select()
    .from(sessionItems)
    .where(and(eq(sessionItems.id, sessionItemId), eq(sessionItems.studentId, studentId)));
  if (!item) return { nextHref: routesFor(prep).session, nextLabel: "See today's session" };
  return nextFromItems(await sessionItemsOf(q, item.sessionId), item, false, prep);
}

/** Active problems of one section and level, in textbook order (the Study Plan's list). */
async function levelList(q: Q, sectionId: string, difficulty: Problem["difficulty"]): Promise<Array<{ id: string }>> {
  return q
    .select({ id: problems.id })
    .from(problems)
    .where(and(eq(problems.sectionId, sectionId), eq(problems.difficulty, difficulty), eq(problems.active, true)))
    .orderBy(asc(problems.sort));
}

async function nextAfter(
  q: Q,
  ctx: { studentId: string; problem: Problem; attempt: Attempt; today: string; easierItem: ReviewItem | null; prep: Prep },
): Promise<{ nextHref: string; nextLabel: string }> {
  const { studentId, problem, attempt, today, easierItem, prep } = ctx;
  const routes = routesFor(prep);
  if (easierItem) {
    return { nextHref: practiceLink(prep, easierItem.problemId, { item: easierItem.id }), nextLabel: "Try an easier problem" };
  }
  let cameFrom: ReviewItem | undefined;
  if (attempt.reviewItemId) {
    [cameFrom] = await q.select().from(reviewItems).where(eq(reviewItems.id, attempt.reviewItemId));
  }
  // Review practice (except an "easier" detour, which returns to the plan) continues through the queue
  // of the same preparation.
  if (cameFrom && cameFrom.reason !== "easier") {
    const [due] = await q
      .select({ id: reviewItems.id, problemId: reviewItems.problemId })
      .from(reviewItems)
      .where(
        and(
          eq(reviewItems.studentId, studentId),
          eq(reviewItems.status, "pending"),
          lte(reviewItems.dueDate, today),
          inArray(reviewItems.problemId, prepProblemIds(q, prep)),
        ),
      )
      .orderBy(asc(reviewItems.dueDate), asc(reviewItems.createdAt))
      .limit(1);
    if (due) return { nextHref: practiceLink(prep, due.problemId, { item: due.id }), nextLabel: "Next review problem" };
    return { nextHref: routes.review, nextLabel: "Back to the review queue" };
  }
  // Back on the Study Plan's list: the next unticked problem at the same level, else the plan itself.
  const base = cameFrom?.sourceProblemId ? ((await getProblem(q, cameFrom.sourceProblemId)) ?? problem) : problem;
  const [list, checked] = await Promise.all([levelList(q, base.sectionId, base.difficulty), loadChecks(q, studentId)]);
  const nextId = nextUnchecked(list, checked, base.id);
  if (nextId) return { nextHref: practiceLink(prep, nextId), nextLabel: "Next problem" };
  return { nextHref: planHref(base.sectionId, difficultyToLevel(base.difficulty), prep), nextLabel: "Back to the Study Plan" };
}

export type HistoryRow = {
  id: string;
  ratedDay: string;
  rating: Rating;
  hintsShown: number;
  answerRevealed: boolean;
  solutionViewed: boolean;
};

/** The student's earlier ratings of one problem, newest first. */
export async function problemHistory(q: Q, studentId: string, problemId: string): Promise<HistoryRow[]> {
  const rows = await q
    .select({
      id: attempts.id,
      ratedDay: attempts.ratedDay,
      rating: attempts.rating,
      hintsShown: attempts.hintsShown,
      answerRevealed: attempts.answerRevealed,
      solutionViewed: attempts.solutionViewed,
    })
    .from(attempts)
    .where(and(eq(attempts.studentId, studentId), eq(attempts.problemId, problemId), isNotNull(attempts.ratedAt)))
    .orderBy(desc(attempts.ratedAt));
  return rows.flatMap((r) => (r.rating && r.ratedDay ? [{ ...r, rating: r.rating, ratedDay: r.ratedDay }] : []));
}

export async function saveNote(q: Q, studentId: string, problemId: string, text: string): Promise<void> {
  const value = text.slice(0, 4000);
  if (value.trim() === "") {
    await q.delete(notes).where(and(eq(notes.studentId, studentId), eq(notes.problemId, problemId)));
    return;
  }
  await q
    .insert(notes)
    .values({ studentId, problemId, text: value })
    .onConflictDoUpdate({ target: [notes.studentId, notes.problemId], set: { text: value, updatedAt: new Date() } });
}

export type WorkspaceData = {
  problem: Problem;
  /** The preparation the problem belongs to (its section's). */
  prep: Prep;
  section: { id: string; title: string; objectives: string[]; concepts: Array<{ id: string; label: string }> };
  position: number | null;
  total: number;
  done: number;
  /** The problems before and after this one in the Study Plan's list (null at either end). */
  prevId: string | null;
  nextId: string | null;
  note: string;
  reviewItem: Pick<ReviewItem, "id" | "reason" | "status" | "dueDate" | "sourceProblemId"> | null;
  recentWeak: Array<{ problemId: string; openstaxNumber: number | null; rating: "shaky" | "lost" }>;
  status: ProblemStatus;
};

export async function workspaceData(q: Q, studentId: string, problemId: string, itemId?: string | null): Promise<WorkspaceData | null> {
  const problem = await getProblem(q, problemId);
  if (!problem) return null;
  let reviewItem: WorkspaceData["reviewItem"] = null;
  if (itemId) {
    const [item] = await q
      .select({ id: reviewItems.id, reason: reviewItems.reason, status: reviewItems.status, dueDate: reviewItems.dueDate, sourceProblemId: reviewItems.sourceProblemId, problemId: reviewItems.problemId })
      .from(reviewItems)
      .where(and(eq(reviewItems.id, itemId), eq(reviewItems.studentId, studentId)));
    if (item && item.problemId === problemId) {
      reviewItem = { id: item.id, reason: item.reason, status: item.status, dueDate: item.dueDate, sourceProblemId: item.sourceProblemId };
    }
  }
  if (!problem.active && !reviewItem) return null;

  const [[section], plan, rated, [note], checked] = await Promise.all([
    q.select().from(sections).where(eq(sections.id, problem.sectionId)),
    // The list the Study Plan shows: this section at this problem's level.
    levelList(q, problem.sectionId, problem.difficulty),
    q
      .select({ problemId: attempts.problemId, rating: attempts.rating, ratedDay: attempts.ratedDay, ratedAt: attempts.ratedAt, openstax: problems.openstaxNumber })
      .from(attempts)
      .innerJoin(problems, eq(problems.id, attempts.problemId))
      .where(and(eq(attempts.studentId, studentId), eq(problems.sectionId, problem.sectionId), isNotNull(attempts.ratedAt))),
    q.select({ text: notes.text }).from(notes).where(and(eq(notes.studentId, studentId), eq(notes.problemId, problemId))),
    loadChecks(q, studentId),
  ]);

  const summaries = summarize(
    rated.map((r) => ({ problemId: r.problemId, rating: r.rating!, ratedDay: r.ratedDay!, ratedAt: r.ratedAt! })),
  );
  const index = plan.findIndex((p) => p.id === problemId);
  const openstaxById = new Map(rated.map((r) => [r.problemId, r.openstax]));
  const recentWeak = [...summaries.entries()]
    .filter(([id, s]) => id !== problemId && (s.latest === "shaky" || s.latest === "lost"))
    .sort((a, b) => (b[1].latestAt?.getTime() ?? 0) - (a[1].latestAt?.getTime() ?? 0))
    .slice(0, 3)
    .map(([id, s]) => ({ problemId: id, openstaxNumber: openstaxById.get(id) ?? null, rating: s.latest as "shaky" | "lost" }));

  return {
    problem,
    prep: section.preparation,
    section: { id: section.id, title: section.title, objectives: section.objectives, concepts: section.concepts },
    position: index >= 0 ? index + 1 : null,
    total: plan.length,
    done: plan.filter((p) => checked.has(p.id)).length,
    ...neighbors(plan, problemId),
    note: note?.text ?? "",
    reviewItem,
    recentWeak,
    status: summaries.get(problemId)?.status ?? "new",
  };
}

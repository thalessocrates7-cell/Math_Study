import { and, asc, eq, inArray, isNotNull, isNull, lte } from "drizzle-orm";
import type { DB, Q } from "../db/client";
import {
  assignments,
  attempts,
  notes,
  problems,
  reviewItems,
  sections,
  type Attempt,
  type Problem,
  type Rating,
  type ReviewItem,
} from "../db/schema";
import { formatMonthDay, todayISO } from "../lib/dates";
import { summarize, type ProblemStatus } from "../lib/mastery";
import { ratingMessage, scheduleAfterRating, type ScheduledRating } from "../lib/scheduler";

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
  opts: { origin: "plan" | "review" | "browse"; reviewItemId?: string | null },
): Promise<AttemptState> {
  const problem = await getProblem(q, problemId);
  if (!problem) throw new PracticeError("not_found");
  let reviewItemId: string | null = null;
  if (opts.reviewItemId) {
    const [item] = await q
      .select({ id: reviewItems.id })
      .from(reviewItems)
      .where(and(eq(reviewItems.id, opts.reviewItemId), eq(reviewItems.studentId, studentId), eq(reviewItems.problemId, problemId)));
    reviewItemId = item?.id ?? null;
  }
  const origin = reviewItemId ? "review" : opts.origin === "review" ? "browse" : opts.origin;
  await q.insert(attempts).values({ studentId, problemId, origin, reviewItemId }).onConflictDoNothing();
  const [open] = await q
    .select()
    .from(attempts)
    .where(and(eq(attempts.studentId, studentId), eq(attempts.problemId, problemId), isNull(attempts.ratedAt)));
  if (reviewItemId && open.reviewItemId !== reviewItemId) {
    await q.update(attempts).set({ reviewItemId, origin: "review" }).where(eq(attempts.id, open.id));
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
};

/** Records a confidence rating, schedules reviews, and works out where Continue should go. */
export async function rateAttempt(db: DB, studentId: string, attemptId: string, rating: ScheduledRating, now = new Date()): Promise<RateOutcome> {
  return db.transaction(async (tx) => {
    const [attempt] = await tx.select().from(attempts).where(and(eq(attempts.id, attemptId), eq(attempts.studentId, studentId)));
    if (!attempt) throw new PracticeError("not_found");
    const problem = await getProblem(tx, attempt.problemId);
    if (!problem) throw new PracticeError("not_found");
    const today = todayISO(now);

    if (attempt.ratedAt && attempt.rating) {
      const next = await nextAfter(tx, { studentId, problem, attempt, today, easierItem: null });
      return { rating: attempt.rating, message: "Your rating was already saved.", ...next, dueDate: attempt.nextReviewDate, alreadyRated: true };
    }

    const [pool, rated, assigned] = await Promise.all([
      tx
        .select({ id: problems.id, difficulty: problems.difficulty, concepts: problems.concepts, sort: problems.sort })
        .from(problems)
        .where(and(eq(problems.sectionId, problem.sectionId), eq(problems.active, true))),
      tx
        .selectDistinct({ problemId: attempts.problemId })
        .from(attempts)
        .where(and(eq(attempts.studentId, studentId), isNotNull(attempts.ratedAt))),
      tx.select({ problemId: assignments.problemId }).from(assignments).where(eq(assignments.studentId, studentId)),
    ]);

    // Any pending review of this problem is answered by this rating.
    await tx
      .update(reviewItems)
      .set({ status: "done", doneAt: now })
      .where(and(eq(reviewItems.studentId, studentId), eq(reviewItems.problemId, problem.id), eq(reviewItems.status, "pending")));
    const pending = await tx
      .select({ problemId: reviewItems.problemId })
      .from(reviewItems)
      .where(and(eq(reviewItems.studentId, studentId), eq(reviewItems.status, "pending")));

    const result = scheduleAfterRating({
      rating,
      problem: { id: problem.id, difficulty: problem.difficulty, concepts: problem.concepts, sort: problem.sort },
      pool,
      today,
      attempted: new Set(rated.map((r) => r.problemId)),
      pending: new Set(pending.map((r) => r.problemId)),
      assigned: new Set(assigned.map((r) => r.problemId)),
      seed: studentId,
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
      .set({ rating, ratedAt: now, ratedDay: today, nextReviewDate: own?.dueDate ?? null })
      .where(eq(attempts.id, attempt.id));

    const easierItem = result.nextProblemId ? (created.find((c) => c.problemId === result.nextProblemId) ?? null) : null;
    const next = await nextAfter(tx, { studentId, problem, attempt, today, easierItem });
    return {
      rating,
      message: ratingMessage(rating, result, own ? formatMonthDay(own.dueDate) : "a later date"),
      ...next,
      dueDate: own?.dueDate ?? null,
      alreadyRated: false,
    };
  });
}

async function nextUnratedInSection(q: Q, studentId: string, sectionId: string): Promise<string | null> {
  const rows = await q
    .select({ problemId: assignments.problemId })
    .from(assignments)
    .innerJoin(problems, eq(problems.id, assignments.problemId))
    .where(and(eq(assignments.studentId, studentId), eq(assignments.sectionId, sectionId), eq(problems.active, true)))
    .orderBy(asc(assignments.position));
  if (rows.length === 0) return null;
  const rated = await q
    .selectDistinct({ problemId: attempts.problemId })
    .from(attempts)
    .where(
      and(
        eq(attempts.studentId, studentId),
        isNotNull(attempts.ratedAt),
        inArray(
          attempts.problemId,
          rows.map((r) => r.problemId),
        ),
      ),
    );
  const done = new Set(rated.map((r) => r.problemId));
  return rows.find((r) => !done.has(r.problemId))?.problemId ?? null;
}

async function nextAfter(
  q: Q,
  ctx: { studentId: string; problem: Problem; attempt: Attempt; today: string; easierItem: ReviewItem | null },
): Promise<{ nextHref: string; nextLabel: string }> {
  const { studentId, problem, attempt, today, easierItem } = ctx;
  if (easierItem) {
    return { nextHref: `/practice/${encodeURIComponent(easierItem.problemId)}?item=${easierItem.id}`, nextLabel: "Try an easier problem" };
  }
  let cameFrom: ReviewItem | undefined;
  if (attempt.reviewItemId) {
    [cameFrom] = await q.select().from(reviewItems).where(eq(reviewItems.id, attempt.reviewItemId));
  }
  // Review practice (except an "easier" detour, which returns to the plan) continues through the queue.
  if (cameFrom && cameFrom.reason !== "easier") {
    const [due] = await q
      .select({ id: reviewItems.id, problemId: reviewItems.problemId })
      .from(reviewItems)
      .where(and(eq(reviewItems.studentId, studentId), eq(reviewItems.status, "pending"), lte(reviewItems.dueDate, today)))
      .orderBy(asc(reviewItems.dueDate), asc(reviewItems.createdAt))
      .limit(1);
    if (due) return { nextHref: `/practice/${encodeURIComponent(due.problemId)}?item=${due.id}`, nextLabel: "Next review problem" };
    return { nextHref: "/review", nextLabel: "Back to the review queue" };
  }
  const sectionId = cameFrom?.sourceProblemId ? ((await getProblem(q, cameFrom.sourceProblemId))?.sectionId ?? problem.sectionId) : problem.sectionId;
  const nextId = await nextUnratedInSection(q, studentId, sectionId);
  if (nextId) return { nextHref: `/practice/${encodeURIComponent(nextId)}`, nextLabel: "Next problem" };
  return { nextHref: `/plan/${encodeURIComponent(sectionId)}?complete=1`, nextLabel: "Finish the section" };
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
  section: { id: string; title: string; objectives: string[]; concepts: Array<{ id: string; label: string }> };
  position: number | null;
  total: number;
  done: number;
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

  const [[section], plan, rated, [note]] = await Promise.all([
    q.select().from(sections).where(eq(sections.id, problem.sectionId)),
    q
      .select({ problemId: assignments.problemId, position: assignments.position })
      .from(assignments)
      .innerJoin(problems, eq(problems.id, assignments.problemId))
      .where(and(eq(assignments.studentId, studentId), eq(assignments.sectionId, problem.sectionId), eq(problems.active, true)))
      .orderBy(asc(assignments.position)),
    q
      .select({ problemId: attempts.problemId, rating: attempts.rating, ratedDay: attempts.ratedDay, ratedAt: attempts.ratedAt, openstax: problems.openstaxNumber })
      .from(attempts)
      .innerJoin(problems, eq(problems.id, attempts.problemId))
      .where(and(eq(attempts.studentId, studentId), eq(problems.sectionId, problem.sectionId), isNotNull(attempts.ratedAt))),
    q.select({ text: notes.text }).from(notes).where(and(eq(notes.studentId, studentId), eq(notes.problemId, problemId))),
  ]);

  const summaries = summarize(
    rated.map((r) => ({ problemId: r.problemId, rating: r.rating!, ratedDay: r.ratedDay!, ratedAt: r.ratedAt! })),
  );
  const index = plan.findIndex((p) => p.problemId === problemId);
  const openstaxById = new Map(rated.map((r) => [r.problemId, r.openstax]));
  const recentWeak = [...summaries.entries()]
    .filter(([id, s]) => id !== problemId && (s.latest === "shaky" || s.latest === "lost"))
    .sort((a, b) => (b[1].latestAt?.getTime() ?? 0) - (a[1].latestAt?.getTime() ?? 0))
    .slice(0, 3)
    .map(([id, s]) => ({ problemId: id, openstaxNumber: openstaxById.get(id) ?? null, rating: s.latest as "shaky" | "lost" }));

  return {
    problem,
    section: { id: section.id, title: section.title, objectives: section.objectives, concepts: section.concepts },
    position: index >= 0 ? index + 1 : null,
    total: plan.length,
    done: plan.filter((p) => summaries.has(p.problemId)).length,
    note: note?.text ?? "",
    reviewItem,
    recentWeak,
    status: summaries.get(problemId)?.status ?? "new",
  };
}

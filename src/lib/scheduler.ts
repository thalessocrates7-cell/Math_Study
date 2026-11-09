/**
 * Targeted reinforcement rules, as pure functions.
 *
 *  Got It  -> nothing extra. Retention is checked by Regressive Study (look-backs) and by the next
 *             day's Challenge, so the old "same problem in 14 days" review is gone.
 *  Shaky   -> review the same problem tomorrow, plus a SIMILAR problem (same section and difficulty,
 *             sharing a concept) tomorrow.
 *  Lost    -> serve an EASIER related problem right away (same concept, Foundation if possible), and
 *             review the original tomorrow.
 */
import type { Difficulty } from "../../content/types";
import { addDays } from "./dates";
import { hashString } from "./random";

export const INTERVAL_DAYS = { shaky: 1, lost: 1 } as const;

export type ScheduledRating = "got_it" | "shaky" | "lost";
export type ReviewReasonOut = "got_it" | "shaky" | "lost" | "similar" | "easier";

export type PoolProblem = {
  id: string;
  difficulty: Difficulty;
  concepts: string[];
  sort: number;
};

export type ScheduleInput = {
  rating: ScheduledRating;
  problem: PoolProblem;
  /** Active problems in the same section (may include the rated problem). */
  pool: PoolProblem[];
  today: string;
  /** Problems this student has rated before (not counting the rating being processed). */
  attempted: ReadonlySet<string>;
  /** Problems that already have a pending review for this student (excluding the rated problem). */
  pending: ReadonlySet<string>;
  /** Problems in this student's study plan. */
  assigned: ReadonlySet<string>;
  /** Stable per-student seed for tie-breaks. */
  seed: string;
  /**
   * Serve the easier problem right away after Lost (default). False when the Lost was itself on an
   * easier follow-up: the next one waits until tomorrow instead of chaining easier problems.
   */
  immediateEasier?: boolean;
};

export type PlannedReview = {
  problemId: string;
  sourceProblemId: string | null;
  dueDate: string;
  reason: ReviewReasonOut;
};

export type ScheduleResult = {
  items: PlannedReview[];
  /** For Lost: the easier problem to show next, right away. */
  nextProblemId: string | null;
  /** The extra problem that was scheduled (similar or easier), if any. */
  followUpId: string | null;
};

const LEVEL: Record<Difficulty, number> = { F: 0, C: 1, Ch: 2 };

function overlap(a: string[], b: string[]): number {
  let n = 0;
  for (const c of a) if (b.includes(c)) n++;
  return n;
}

/** Best candidate from the first non-empty tier: most shared concepts, then a stable per-student shuffle. */
function pickFromTiers(tiers: PoolProblem[][], target: PoolProblem, seed: string): PoolProblem | null {
  for (const tier of tiers) {
    if (tier.length === 0) continue;
    const ranked = [...tier].sort((a, b) => {
      const diff = overlap(b.concepts, target.concepts) - overlap(a.concepts, target.concepts);
      if (diff !== 0) return diff;
      return hashString(`${seed}:${target.id}:${a.id}`) - hashString(`${seed}:${target.id}:${b.id}`);
    });
    return ranked[0];
  }
  return null;
}

function candidates(input: ScheduleInput): PoolProblem[] {
  return input.pool.filter((p) => p.id !== input.problem.id && !input.pending.has(p.id));
}

export function pickSimilar(input: ScheduleInput): PoolProblem | null {
  const { problem, attempted, assigned, seed } = input;
  const fresh = candidates(input).filter((p) => !attempted.has(p.id));
  const shares = (p: PoolProblem) => overlap(p.concepts, problem.concepts) > 0;
  const same = (p: PoolProblem) => p.difficulty === problem.difficulty;
  const notHarder = (p: PoolProblem) => LEVEL[p.difficulty] <= LEVEL[problem.difficulty];
  return pickFromTiers(
    [
      fresh.filter((p) => same(p) && shares(p) && !assigned.has(p.id)),
      fresh.filter((p) => same(p) && shares(p)),
      fresh.filter((p) => same(p)),
      fresh.filter((p) => shares(p) && notHarder(p)),
    ],
    problem,
    seed,
  );
}

export function pickEasier(input: ScheduleInput): PoolProblem | null {
  const { problem, attempted, seed } = input;
  const all = candidates(input);
  const fresh = all.filter((p) => !attempted.has(p.id));
  const shares = (p: PoolProblem) => overlap(p.concepts, problem.concepts) > 0;
  const lower = (p: PoolProblem) => LEVEL[p.difficulty] < LEVEL[problem.difficulty];
  const foundation = (p: PoolProblem) => p.difficulty === "F";
  return pickFromTiers(
    [
      fresh.filter((p) => foundation(p) && shares(p)),
      fresh.filter((p) => lower(p) && shares(p)),
      fresh.filter((p) => foundation(p)),
      fresh.filter((p) => lower(p)),
      // Nothing new left: an easier problem the student has seen before still helps.
      all.filter((p) => foundation(p) && shares(p)),
      all.filter((p) => foundation(p)),
    ],
    problem,
    seed,
  );
}

export function scheduleAfterRating(input: ScheduleInput): ScheduleResult {
  const { rating, problem, today } = input;
  if (rating === "got_it") return { items: [], nextProblemId: null, followUpId: null };
  if (rating === "shaky") {
    const similar = pickSimilar(input);
    const items: PlannedReview[] = [
      { problemId: problem.id, sourceProblemId: null, dueDate: addDays(today, INTERVAL_DAYS.shaky), reason: "shaky" },
    ];
    if (similar) {
      items.push({ problemId: similar.id, sourceProblemId: problem.id, dueDate: addDays(today, INTERVAL_DAYS.shaky), reason: "similar" });
    }
    return { items, nextProblemId: null, followUpId: similar?.id ?? null };
  }
  const easier = pickEasier(input);
  const now = input.immediateEasier !== false;
  const items: PlannedReview[] = [
    { problemId: problem.id, sourceProblemId: null, dueDate: addDays(today, INTERVAL_DAYS.lost), reason: "lost" },
  ];
  if (easier) {
    items.push({ problemId: easier.id, sourceProblemId: problem.id, dueDate: now ? today : addDays(today, 1), reason: "easier" });
  }
  return { items, nextProblemId: now ? (easier?.id ?? null) : null, followUpId: easier?.id ?? null };
}

/**
 * After a Got it without the worked solution on a problem that was rated Shaky or Lost before, its
 * pending follow-ups (the similar or easier problems made from it) are no longer needed. The original's
 * own re-check is never closed this way: getting an easier problem right doesn't show the original stuck.
 */
export function followUpsToClose(
  pending: ReadonlyArray<{ id: string; problemId: string; sourceProblemId: string | null; reason: string }>,
  ratedProblemId: string,
): string[] {
  return pending.filter((r) => r.sourceProblemId === ratedProblemId && (r.reason === "similar" || r.reason === "easier")).map((r) => r.id);
}

export function ratingMessage(rating: ScheduledRating, result: ScheduleResult, opts: { solutionViewed?: boolean } = {}): string {
  if (rating === "got_it") {
    return opts.solutionViewed
      ? "Nice. Since you used the worked solution, a problem like this comes back on a later day so you can try it on your own."
      : "Nice work. This idea comes back on a later day to check that it stuck.";
  }
  if (rating === "shaky") {
    return result.followUpId
      ? "Added to your review queue for tomorrow, along with a similar problem for extra practice."
      : "Added to your review queue for tomorrow.";
  }
  if (result.nextProblemId) return "That's okay. Next up is an easier problem on the same idea. This one comes back tomorrow.";
  if (result.followUpId) return "That's okay. This one comes back tomorrow, with an easier problem on the same idea. Read the worked solution once more before moving on.";
  return "That's okay. This one is in your review queue for tomorrow. Read the worked solution once more before moving on.";
}

/**
 * Review scheduling rules (design doc §4.3), as pure functions.
 *
 *  Got It  -> review the same problem in 14 days; no extra practice.
 *  Shaky   -> review the same problem tomorrow, plus a SIMILAR problem (same section and difficulty,
 *             sharing a concept) tomorrow.
 *  Lost    -> serve an EASIER related problem right away (same concept, Foundation if possible), and
 *             review the original tomorrow. The section is flagged for extra focus.
 */
import type { Difficulty } from "../../content/types";
import { addDays } from "./dates";
import { hashString } from "./random";

export const INTERVAL_DAYS = { got_it: 14, shaky: 1, lost: 1 } as const;

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
  if (rating === "got_it") {
    return {
      items: [{ problemId: problem.id, sourceProblemId: null, dueDate: addDays(today, INTERVAL_DAYS.got_it), reason: "got_it" }],
      nextProblemId: null,
      followUpId: null,
    };
  }
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
  const items: PlannedReview[] = [
    { problemId: problem.id, sourceProblemId: null, dueDate: addDays(today, INTERVAL_DAYS.lost), reason: "lost" },
  ];
  if (easier) {
    items.push({ problemId: easier.id, sourceProblemId: problem.id, dueDate: today, reason: "easier" });
  }
  return { items, nextProblemId: easier?.id ?? null, followUpId: easier?.id ?? null };
}

export function ratingMessage(rating: ScheduledRating, result: ScheduleResult, dueLabel: string): string {
  if (rating === "got_it") return `Nice work. You'll see this one again on ${dueLabel} to make sure it sticks.`;
  if (rating === "shaky") {
    return result.followUpId
      ? "Added to your review queue for tomorrow, along with a similar problem for extra practice."
      : "Added to your review queue for tomorrow.";
  }
  return result.followUpId
    ? "That's okay. Next up is an easier problem on the same idea. This one comes back tomorrow."
    : "That's okay. This one is in your review queue for tomorrow. Read the worked solution once more before moving on.";
}

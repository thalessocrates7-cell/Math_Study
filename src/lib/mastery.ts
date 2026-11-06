/**
 * Mastery rules (design doc §4.3: "mastered only after multiple successful attempts").
 *  - A problem is MASTERED when its latest rating is Got It and it was rated Got It on at least two
 *    different days.
 *  - A section is MASTERED when every assigned problem's latest rating is Got It.
 */
export type RatingValue = "got_it" | "shaky" | "lost" | "skipped";
export type ProblemStatus = "new" | "got_it" | "shaky" | "lost" | "mastered";

export type RatedAttempt = {
  problemId: string;
  rating: RatingValue;
  ratedDay: string;
  ratedAt: Date;
};

export type ProblemSummary = {
  latest: RatingValue | null;
  latestAt: Date | null;
  gotItDays: number;
  attempts: number;
  status: ProblemStatus;
};

export function summarize(attempts: RatedAttempt[]): Map<string, ProblemSummary> {
  const byProblem = new Map<string, RatedAttempt[]>();
  for (const a of attempts) {
    const list = byProblem.get(a.problemId);
    if (list) list.push(a);
    else byProblem.set(a.problemId, [a]);
  }
  const out = new Map<string, ProblemSummary>();
  for (const [problemId, list] of byProblem) {
    list.sort((a, b) => a.ratedAt.getTime() - b.ratedAt.getTime());
    const last = list[list.length - 1];
    const gotItDays = new Set(list.filter((a) => a.rating === "got_it").map((a) => a.ratedDay)).size;
    out.set(problemId, {
      latest: last.rating,
      latestAt: last.ratedAt,
      gotItDays,
      attempts: list.length,
      status: statusFrom(last.rating, gotItDays),
    });
  }
  return out;
}

export function statusFrom(latest: RatingValue | null, gotItDays: number): ProblemStatus {
  if (!latest || latest === "skipped") return "new";
  if (latest === "got_it") return gotItDays >= 2 ? "mastered" : "got_it";
  return latest;
}

export function isSectionMastered(assignedIds: string[], summaries: Map<string, ProblemSummary>): boolean {
  if (assignedIds.length === 0) return false;
  return assignedIds.every((id) => summaries.get(id)?.latest === "got_it");
}

/** Confidence score: Got It = 3, Shaky = 2, Lost = 1. */
export const CONFIDENCE_SCORE: Record<"got_it" | "shaky" | "lost", number> = { got_it: 3, shaky: 2, lost: 1 };

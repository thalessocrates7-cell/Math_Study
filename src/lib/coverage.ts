/**
 * Final Exam question coverage: for each chapter of the candidate pool (content/final-exam.ts), how
 * many questions the student has attempted, has not attempted yet, has waiting in review, rated how
 * (self-reported), and checked again on a later day. Pure, so the dashboard and the tests agree.
 *
 * "Attempted" and "Not yet attempted" split the pool (they add up to its size). The other counts
 * overlap them and each other, so they are never added into a total.
 */
export type PoolChapter = { sectionId: string; chapter: number; title: string; numbers: readonly number[] };

export type CoverageInput = {
  pool: readonly PoolChapter[];
  /** The Final Exam's problems in the app (a pool question is in the app once one has its number). */
  problems: ReadonlyArray<{ id: string; sectionId: string; openstaxNumber: number | null; active: boolean }>;
  /** The student's rated attempts at Final Exam problems. */
  rated: ReadonlyArray<{ problemId: string; rating: "got_it" | "shaky" | "lost" | "skipped"; ratedDay: string; ratedAt: Date }>;
  /** Problems with a review waiting (due or not). */
  pending: ReadonlySet<string>;
};

export type Coverage = {
  total: number;
  /** Pool questions that can be practiced in the app now. */
  inApp: number;
  attempted: number;
  notAttempted: number;
  awaitingReview: number;
  /** Latest self-reported rating of each attempted question. */
  latest: { got_it: number; shaky: number; lost: number };
  /** Attempted questions rated again on a later day (a retention check). */
  rechecked: number;
};

export type ChapterCoverage = Coverage & { sectionId: string; chapter: number; title: string };

const empty = (): Coverage => ({ total: 0, inApp: 0, attempted: 0, notAttempted: 0, awaitingReview: 0, latest: { got_it: 0, shaky: 0, lost: 0 }, rechecked: 0 });

export function computeCoverage(input: CoverageInput): { chapters: ChapterCoverage[]; all: Coverage } {
  const byKey = new Map<string, Array<{ id: string; active: boolean }>>();
  for (const p of input.problems) {
    if (p.openstaxNumber === null) continue;
    const key = `${p.sectionId}#${p.openstaxNumber}`;
    const list = byKey.get(key) ?? [];
    list.push({ id: p.id, active: p.active });
    byKey.set(key, list);
  }
  const ratingsOf = new Map<string, Array<{ rating: string; ratedDay: string; ratedAt: Date }>>();
  for (const r of input.rated) {
    if (r.rating === "skipped") continue;
    const list = ratingsOf.get(r.problemId) ?? [];
    list.push(r);
    ratingsOf.set(r.problemId, list);
  }

  const all = empty();
  const chapters = input.pool.map((ch) => {
    const c: ChapterCoverage = { ...empty(), sectionId: ch.sectionId, chapter: ch.chapter, title: ch.title };
    for (const n of new Set(ch.numbers)) {
      c.total++;
      const ids = byKey.get(`${ch.sectionId}#${n}`) ?? [];
      if (ids.some((p) => p.active)) c.inApp++;
      const ratings = ids.flatMap((p) => ratingsOf.get(p.id) ?? []).sort((a, b) => a.ratedAt.getTime() - b.ratedAt.getTime());
      if (ids.some((p) => input.pending.has(p.id))) c.awaitingReview++;
      if (ratings.length === 0) {
        c.notAttempted++;
        continue;
      }
      c.attempted++;
      const last = ratings[ratings.length - 1].rating as keyof Coverage["latest"];
      c.latest[last]++;
      if (new Set(ratings.map((r) => r.ratedDay)).size >= 2) c.rechecked++;
    }
    for (const k of ["total", "inApp", "attempted", "notAttempted", "awaitingReview", "rechecked"] as const) all[k] += c[k];
    for (const k of ["got_it", "shaky", "lost"] as const) all.latest[k] += c.latest[k];
    return c;
  });
  return { chapters, all };
}

import type { Check, Difficulty, PlotSpec, ProblemImage, ProblemSeed, SectionId, Step } from "./types";

/** Tag for TeX-heavy strings: keeps backslashes literal. */
export const t = String.raw;

type ProblemInput = {
  /** OpenStax exercise number, or a string like "o1" for an original problem. */
  n: number | string;
  d: Difficulty;
  c: string[];
  q: string;
  hints: string[];
  a: string;
  steps: Array<[string, string]>;
  check: Check | Check[];
  figure?: PlotSpec;
  image?: ProblemImage;
};

/** Builds the problems for one section with consistent ids and sort order. */
export function sectionProblems(section: SectionId, items: ProblemInput[]): ProblemSeed[] {
  return items.map((p, i) => {
    const isOpenstax = typeof p.n === "number";
    const steps: Step[] = p.steps.map(([title, body]) => ({ title, body }));
    return {
      id: `${section}-${p.n}`,
      section,
      openstax: isOpenstax ? (p.n as number) : null,
      difficulty: p.d,
      concepts: p.c,
      statement: p.q,
      figure: p.figure,
      image: p.image,
      hints: p.hints,
      answer: p.a,
      steps,
      check: p.check,
      sort: isOpenstax ? (p.n as number) : 10_000 + i,
    };
  });
}

/** Samples y = f(x) on [a, b] into a polyline for a PlotSpec (runs at seed time only). */
export function sample(f: (x: number) => number, a: number, b: number, n = 96): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const x = a + ((b - a) * i) / n;
    pts.push([round(x), round(f(x))]);
  }
  return pts;
}

function round(v: number): number {
  return Math.round(v * 1e4) / 1e4;
}

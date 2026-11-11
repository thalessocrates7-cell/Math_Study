import type { SectionSeed } from "./types";

const BOOK = "https://openstax.org/books/calculus-volume-1/pages/";

/** Class defaults for the Final Exam (the admin can change them in /admin → Settings). */
export const FINAL_EXAM = {
  name: "Final Exam",
  date: "2026-12-14",
  /** 24-hour time in New York (America/New_York), the zone every date on this site uses. */
  time: "14:00",
} as const;

/**
 * The Final Exam's units: one per chapter, studied from the OpenStax chapter review exercises
 * (the questions are in problems/final-2.ts ... final-5.ts). These records belong to the Final Exam
 * preparation only (sections.preparation = 'final'), so its progress never mixes with the
 * Integration Review sections (4.10, 5.1–5.7).
 *
 * Objectives and skill tags are written for this site. The ids follow OpenStax's own chapter
 * numbering ("2 Limits").
 */
export const FINAL_SECTIONS: SectionSeed[] = [
  {
    id: "2",
    title: "Limits",
    kind: "core",
    sort: 1,
    url: BOOK + "2-review-exercises",
    objectives: [
      "Find limits from a graph and algebraically, or explain why a limit does not exist.",
      "Prove limits with the Squeeze Theorem and the precise definition of a limit.",
      "Decide where a function is continuous and apply the Intermediate Value Theorem.",
      "Estimate instantaneous velocity from average velocities.",
    ],
    concepts: [
      { id: "limit-facts", label: "Limit and continuity facts (true or false)" },
      { id: "limits-graph", label: "Limits from a graph" },
      { id: "limits-algebra", label: "Evaluating limits algebraically" },
      { id: "squeeze", label: "The Squeeze Theorem" },
      { id: "continuity", label: "Continuity" },
      { id: "precise-definition", label: "The precise definition of a limit" },
      { id: "ivt", label: "The Intermediate Value Theorem" },
      { id: "velocity", label: "Average and instantaneous velocity" },
    ],
  },
  {
    id: "3",
    title: "Derivatives",
    kind: "core",
    sort: 2,
    url: BOOK + "3-review-exercises",
    objectives: [
      "Explain how differentiability and continuity are related.",
      "Find derivatives from the limit definition and with the power, product, quotient and chain rules.",
      "Differentiate exponential, logarithmic, trigonometric and inverse trigonometric functions, implicitly and to higher orders.",
      "Write the equation of a tangent line.",
      "Sketch the graph of a function's derivative from the graph of the function.",
      "Interpret the derivative as a rate of change, from a formula and from data.",
    ],
    concepts: [
      { id: "differentiability", label: "Differentiability and continuity (true or false)" },
      { id: "limit-definition", label: "The limit definition of the derivative" },
      { id: "derivative-rules", label: "Power, product and quotient rules" },
      { id: "chain-rule", label: "The chain rule" },
      { id: "exp-log-derivatives", label: "Derivatives of exponential and logarithmic functions" },
      { id: "trig-derivatives", label: "Derivatives of trigonometric and inverse trigonometric functions" },
      { id: "implicit-differentiation", label: "Implicit differentiation" },
      { id: "higher-derivatives", label: "Higher-order derivatives" },
      { id: "tangent-lines", label: "Tangent lines" },
      { id: "derivative-graphs", label: "Graphing the derivative from a graph" },
      { id: "rates-of-change", label: "Rates of change and what they mean" },
    ],
  },
  {
    id: "4",
    title: "Applications of Derivatives",
    kind: "core",
    sort: 3,
    url: BOOK + "4-review-exercises",
    objectives: [
      "Use the Mean Value Theorem and the first and second derivatives to describe a graph.",
      "Find critical points and local and absolute extrema.",
      "Use linear approximations, differentials and Newton's method.",
      "Evaluate limits at infinity and sketch graphs with their asymptotes.",
      "Solve related-rates and optimization problems, and find antiderivatives.",
    ],
    concepts: [
      { id: "derivative-facts", label: "Derivative facts (true or false)" },
      { id: "graph-shape", label: "Increasing, decreasing and concavity" },
      { id: "linear-approximation", label: "Linear approximations and differentials" },
      { id: "extrema", label: "Critical points and extrema" },
      { id: "limits", label: "Limits at infinity and 0/0 forms" },
      { id: "newtons-method", label: "Newton's method" },
      { id: "antiderivatives", label: "Antiderivatives" },
      { id: "curve-sketching", label: "Sketching graphs" },
      { id: "related-rates", label: "Related rates" },
      { id: "optimization", label: "Optimization" },
    ],
  },
  {
    id: "5",
    title: "Integration",
    kind: "core",
    sort: 4,
    url: BOOK + "5-review-exercises",
    objectives: [
      "Approximate integrals with left and right Riemann sums.",
      "Evaluate definite and indefinite integrals, including by substitution.",
      "Differentiate functions defined by integrals.",
      "Apply net change and average value to real data.",
    ],
    concepts: [
      { id: "integral-facts", label: "Integral facts (true or false)" },
      { id: "riemann-sums", label: "Riemann sums" },
      { id: "definite-integrals", label: "Evaluating definite integrals" },
      { id: "antiderivatives", label: "Finding antiderivatives" },
      { id: "ftc-derivatives", label: "Derivatives of integrals" },
      { id: "net-change", label: "Net change and average value" },
    ],
  },
];

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/**
 * The Final Exam's candidate question pool: the OpenStax chapter review exercises named in the
 * import specification (77 questions: Chapters 2, 4 and 5), plus all 25 of Chapter 3's Review
 * Exercises, 367–391, added at the owner's request. That is 102 questions. It is the pool as
 * currently known, not a promise that the exam covers nothing else, so the site calls it the
 * "initial pool" (the owner confirmed on 2026-11-11 that it may still grow). Edit the numbers here to grow it.
 * Chapter 4 Exercise 542 is left out on purpose (the L'Hôpital's Rule item).
 */
export const FINAL_POOL: ReadonlyArray<{ sectionId: string; chapter: number; title: string; numbers: readonly number[]; excluded: readonly number[] }> = [
  { sectionId: "2", chapter: 2, title: "Limits", numbers: range(208, 232), excluded: [] },
  { sectionId: "3", chapter: 3, title: "Derivatives", numbers: range(367, 391), excluded: [] },
  { sectionId: "4", chapter: 4, title: "Applications of Derivatives", numbers: [...range(525, 541), ...range(543, 552)], excluded: [542] },
  { sectionId: "5", chapter: 5, title: "Integration", numbers: range(439, 463), excluded: [] },
];

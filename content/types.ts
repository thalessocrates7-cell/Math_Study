/**
 * Content model for the problem bank.
 *
 * Text fields use a small markup: plain text with inline math in $...$ and display math in $$...$$.
 * Write TeX with the `t` tag (String.raw) so backslashes stay literal. Never write the two-character
 * sequence "$" + "{" inside a t`` template (it would be read as a template interpolation).
 */

export type Difficulty = "F" | "C" | "Ch";

export const DIFFICULTIES: readonly Difficulty[] = ["F", "C", "Ch"] as const;

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  F: "Foundation",
  C: "Core",
  Ch: "Challenge",
};

export const DIFFICULTY_BLURB: Record<Difficulty, string> = {
  F: "Build the basics",
  C: "Standard problems",
  Ch: "Multi-step or applied",
};

export type Step = { title: string; body: string };

/** A machine-checkable claim about the answer, verified by dev/verify_content.py (SymPy). */
export type Check =
  /** d/d(var) F == f */
  | { kind: "antiderivative"; f: string; F: string; var?: string }
  /** integral of f from a to b == value */
  | { kind: "definite"; f: string; a: string; b: string; value: string; var?: string }
  /** expr (any SymPy expression, may use Sum/Integral) == value */
  | { kind: "value"; expr: string; value: string }
  /** F^(order)(var) == df and F(x0) == y0 (order defaults to 1) */
  | { kind: "ivp"; df: string; F: string; x0: string; y0: string; var?: string; order?: number }
  /** d/d(var) expr == value (expr may contain an Integral with variable limits) */
  | { kind: "derivative"; expr: string; value: string; var?: string }
  /** A conceptual answer that SymPy cannot check; say what a human verified. */
  | { kind: "manual"; note: string };

/** Graph data for a figure. Points are precomputed so no expression is ever evaluated at runtime. */
export type PlotSpec = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  /** One or more polylines (sampled curves or piecewise-linear graphs). shade: fill to the x-axis. */
  curves: Array<{ points: Array<[number, number]>; label?: string; shade?: boolean }>;
  /** "equal" keeps 1 unit the same length on both axes (circles look round). Default: 0.6 height/width. */
  aspect?: "equal" | number;
  /** Riemann-sum rectangles: left edge x, width w, height h. */
  rects?: Array<{ x: number; w: number; h: number }>;
  /** Marked points (e.g. given data points). */
  dots?: Array<[number, number]>;
  xTicks?: number[];
  yTicks?: number[];
  /** Required text alternative describing everything the figure shows. */
  alt: string;
};

/**
 * An original source figure (e.g. an OpenStax graph the question depends on), served from public/.
 * `width`/`height` are the image's pixel size (reserved on the page so nothing jumps while it loads).
 * `alt` must describe everything the question needs from the picture.
 */
export type ProblemImage = { src: string; alt: string; width: number; height: number };

export type ProblemSeed = {
  /** Stable id, e.g. "5.2-80" (section + OpenStax exercise number) or "5.4-o1" for originals. */
  id: string;
  section: SectionId;
  /** OpenStax Calculus Volume 1 exercise number, or null for an original problem. */
  openstax: number | null;
  difficulty: Difficulty;
  /** Concept tags from CONCEPTS[section]. Used to pick similar and easier follow-up problems. */
  concepts: string[];
  statement: string;
  figure?: PlotSpec;
  /** An original source figure the question depends on (shown instead of a drawn graph). */
  image?: ProblemImage;
  hints: string[];
  answer: string;
  steps: Step[];
  check: Check | Check[];
  /** Ordering within the section (OpenStax number; originals sort after). */
  sort: number;
};

/** Integration Review sections (4.1 ... 5.7), then the Final Exam's chapters ("2", "4", "5"; see final-exam.ts). */
export type SectionId = "4.1" | "4.2" | "4.10" | "5.1" | "5.2" | "5.3" | "5.4" | "5.5" | "5.6" | "5.7" | "2" | "4" | "5";

/** Core sections are on Exam 4. Supplementary sections are optional extra practice and never count toward it. */
export type SectionKind = "core" | "supplementary";

/**
 * A skill (concept tag). `prerequisites` are skills it builds on, written "section:skill"
 * (e.g. "4.10:power-rule"). The planner uses them to decide which earlier units come back sooner.
 */
export type ConceptSeed = { id: string; label: string; prerequisites?: string[] };

export type SectionSeed = {
  id: SectionId;
  title: string;
  kind: SectionKind;
  objectives: string[];
  concepts: ConceptSeed[];
  sort: number;
  url: string;
};

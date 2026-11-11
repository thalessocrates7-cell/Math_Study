import p410 from "./problems/4-10";
import p51 from "./problems/5-1";
import p52 from "./problems/5-2";
import p53 from "./problems/5-3";
import p54 from "./problems/5-4";
import p55 from "./problems/5-5";
import p56 from "./problems/5-6";
import p57 from "./problems/5-7";
import final2 from "./problems/final-2";
import final4 from "./problems/final-4";
import final5 from "./problems/final-5";
import { SECTIONS } from "./sections";
import type { ProblemSeed } from "./types";

export { CORE_SECTIONS, SECTIONS } from "./sections";
export { FINAL_EXAM, FINAL_POOL, FINAL_SECTIONS } from "./final-exam";
export * from "./types";

/** Integration Review problems (4.10, 5.1–5.7). */
export const SECTION_PROBLEMS: ProblemSeed[] = [...p410, ...p51, ...p52, ...p53, ...p54, ...p55, ...p56, ...p57];
/** The Final Exam's questions: the chapter review exercises of Chapters 2, 4 and 5. */
export const FINAL_PROBLEMS: ProblemSeed[] = [...final2, ...final4, ...final5];
export const ALL_PROBLEMS: ProblemSeed[] = [...SECTION_PROBLEMS, ...FINAL_PROBLEMS];

/** Default plan: 15 problems per section (5 Foundation, 7 Core, 3 Challenge). */
export const DEFAULT_PLAN = { foundation: 5, core: 7, challenge: 3 } as const;
/** Fallback when a section's pool is too small for 15: 10 problems (3/5/2). */
export const SMALL_PLAN = { foundation: 3, core: 5, challenge: 2 } as const;

export const DEFAULT_EXAM = { name: "Exam 4", date: "2026-12-02" } as const;

export const ATTRIBUTION =
  "Practice problems adapted from Calculus Volume 1 by Gilbert Strang and Edwin “Jed” Herman, OpenStax, licensed under CC BY-NC-SA 4.0. Hints and worked solutions are original to this site and shared under the same license.";

export function sectionById(id: string) {
  return SECTIONS.find((s) => s.id === id);
}

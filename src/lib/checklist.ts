/**
 * The Study Plan checklist: one section at one level, with a checkbox per problem.
 * Pure helpers (no database), so the page, the server and the tests share the same rules.
 */
import type { Difficulty } from "../../content/types";

export type Level = "foundation" | "core" | "challenge";
export const LEVELS: Level[] = ["foundation", "core", "challenge"];

const TO_DIFFICULTY: Record<Level, Difficulty> = { foundation: "F", core: "C", challenge: "Ch" };
const TO_LEVEL: Record<Difficulty, Level> = { F: "foundation", C: "core", Ch: "challenge" };

export const levelToDifficulty = (l: Level): Difficulty => TO_DIFFICULTY[l];
export const difficultyToLevel = (d: Difficulty): Level => TO_LEVEL[d];

/** Reads a level from an address value: the word ("challenge") or the old letters ("Ch"). Null if unknown. */
export function parseLevel(v: unknown): Level | null {
  if (typeof v !== "string") return null;
  if ((LEVELS as string[]).includes(v)) return v as Level;
  if (v === "F" || v === "C" || v === "Ch") return TO_LEVEL[v];
  return null;
}

export type ChecklistProblem = { id: string; sectionId: string; difficulty: Difficulty; sort: number; active: boolean };

/** Active problems of one section and level, in textbook order. Every student sees the same list. */
export function checklistFor<T extends ChecklistProblem>(problems: readonly T[], sectionId: string, level: Level): T[] {
  const d = TO_DIFFICULTY[level];
  return problems.filter((p) => p.active && p.sectionId === sectionId && p.difficulty === d).sort((a, b) => a.sort - b.sort);
}

export function checklistProgress(list: readonly { id: string }[], checked: ReadonlySet<string>): { done: number; total: number; percent: number } {
  const total = list.length;
  const done = list.filter((p) => checked.has(p.id)).length;
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
}

/** The next problem without a tick, after `afterId` if given (then wrapping to the start); null when all are ticked. */
export function nextUnchecked(list: readonly { id: string }[], checked: ReadonlySet<string>, afterId?: string): string | null {
  const start = afterId ? list.findIndex((p) => p.id === afterId) + 1 : 0;
  const ordered = [...list.slice(start), ...list.slice(0, start)];
  return ordered.find((p) => !checked.has(p.id))?.id ?? null;
}

/** The section the page opens on: the one being studied now, else the first section. */
export function defaultSection(sectionIds: readonly string[], currentUnitId: string | null): string | null {
  if (currentUnitId && sectionIds.includes(currentUnitId)) return currentUnitId;
  return sectionIds[0] ?? null;
}

export function planHref(sectionId: string, level: Level): string {
  return `/plan?section=${encodeURIComponent(sectionId)}&level=${level}`;
}

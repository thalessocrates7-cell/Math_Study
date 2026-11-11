import { FINAL_BASE, isFinalPath } from "./prep";

/**
 * Which sidebar item is the current page. A practice problem belongs to the place it was opened
 * from: today's session (?s=), the Review Queue (?item=), or otherwise the Study Plan. The Final
 * Exam's pages (/final-exam/...) work the same way inside their own sidebar.
 */
export function navPath(pathname: string, search: { get(name: string): string | null }): string {
  const final = isFinalPath(pathname);
  const rest = final ? pathname.slice(FINAL_BASE.length) : pathname;
  if (rest !== "/practice" && !rest.startsWith("/practice/")) return pathname;
  const base = final ? FINAL_BASE : "";
  if (search.get("s")) return `${base}/session`;
  if (search.get("item")) return `${base}/review`;
  return `${base}/plan`;
}

/** True when the path is one of the prefixes or below it. */
export function isActive(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Whether a nav item is the current page: its own address (exactly, for an item like the Final
 * Exam's Dashboard at /final-exam that every Final Exam page sits below), or one of its `also` prefixes.
 */
export function itemActive(path: string, item: { href: string; exact?: boolean; also?: readonly string[] }): boolean {
  const own = item.exact ? path === item.href : isActive(path, [item.href]);
  return own || isActive(path, item.also ?? []);
}

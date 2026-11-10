/**
 * Which sidebar item is the current page. A practice problem belongs to the place it was opened
 * from: today's session (?s=), the Review Queue (?item=), or otherwise the Study Plan.
 */
export function navPath(pathname: string, search: { get(name: string): string | null }): string {
  if (pathname !== "/practice" && !pathname.startsWith("/practice/")) return pathname;
  if (search.get("s")) return "/session";
  if (search.get("item")) return "/review";
  return "/plan";
}

/** True when the path is one of the prefixes or below it. */
export function isActive(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

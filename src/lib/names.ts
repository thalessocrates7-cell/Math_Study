export type NameResult =
  | { ok: true; first: string; last: string; key: string }
  | { ok: false; error: string; field: "first" | "last" | "both" };

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}'’.\- ]*$/u;
const MAX = 40;

function clean(value: string): string {
  return value.normalize("NFC").replace(/\s+/g, " ").trim();
}

/** Account key: the same person typing their name with different spacing or capitals gets one account. */
export function nameKey(first: string, last: string): string {
  const k = (s: string) => clean(s).replace(/’/g, "'").toLocaleLowerCase("en-US");
  return `${k(first)}|${k(last)}`;
}

export function normalizeName(firstRaw: string, lastRaw: string): NameResult {
  const first = clean(firstRaw ?? "");
  const last = clean(lastRaw ?? "");
  if (!first && !last) return { ok: false, error: "Please enter your first and last name.", field: "both" };
  if (!first) return { ok: false, error: "Please enter your first name.", field: "first" };
  if (!last) return { ok: false, error: "Please enter your last name.", field: "last" };
  if (first.length > MAX) return { ok: false, error: `First name can be up to ${MAX} characters.`, field: "first" };
  if (last.length > MAX) return { ok: false, error: `Last name can be up to ${MAX} characters.`, field: "last" };
  if (!NAME_RE.test(first)) return { ok: false, error: "Use letters, spaces, hyphens or apostrophes in your first name.", field: "first" };
  if (!NAME_RE.test(last)) return { ok: false, error: "Use letters, spaces, hyphens or apostrophes in your last name.", field: "last" };
  return { ok: true, first, last, key: nameKey(first, last) };
}

export function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

/** Calendar helpers. "Days" are calendar days in America/New_York (NVCC's time zone), as YYYY-MM-DD. */
export const TIME_ZONE = "America/New_York";

function parts(now: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  });
  const map: Record<string, string> = {};
  for (const p of fmt.formatToParts(now)) map[p.type] = p.value;
  return { y: map.year, m: map.month, d: map.day, h: Number(map.hour) };
}

export function todayISO(now: Date = new Date()): string {
  const { y, m, d } = parts(now);
  return `${y}-${m}-${d}`;
}

function toUTC(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  return new Date(toUTC(iso) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUTC(to) - toUTC(from)) / 86_400_000);
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(opts: Intl.DateTimeFormatOptions) {
  const key = JSON.stringify(opts);
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" });
    fmtCache.set(key, f);
  }
  return f;
}

/** "Thursday, November 5, 2026" */
export function formatLongDate(iso: string): string {
  return fmt({ weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(toUTC(iso));
}

/** "December 2, 2026" */
export function formatFullDate(iso: string): string {
  return fmt({ month: "long", day: "numeric", year: "numeric" }).format(toUTC(iso));
}

/** "Dec 2" */
export function formatMonthDay(iso: string): string {
  return fmt({ month: "short", day: "numeric" }).format(toUTC(iso));
}

/** "Thu, Nov 5" */
export function formatShortWeekday(iso: string): string {
  return fmt({ weekday: "short", month: "short", day: "numeric" }).format(toUTC(iso));
}

/** The New York clock time as "HH:MM" (24-hour), e.g. "14:05". */
export function clockHHMM(now: Date = new Date()): string {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const map: Record<string, string> = {};
  for (const p of f.formatToParts(now)) map[p.type] = p.value;
  return `${map.hour}:${map.minute}`;
}

export function greeting(now: Date = new Date()): string {
  const { h } = parts(now);
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** "today", "tomorrow", "yesterday", "in 3 days", "3 days ago" */
export function relativeDay(iso: string, today: string): string {
  const n = daysBetween(today, iso);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === -1) return "yesterday";
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

/** Converts a timestamp to its New York calendar day. */
export function dayOf(ts: Date): string {
  return todayISO(ts);
}

export function isISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const back = new Date(toUTC(value)).toISOString().slice(0, 10);
  return back === value;
}

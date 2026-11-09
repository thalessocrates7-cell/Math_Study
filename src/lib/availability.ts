/**
 * A student's weekly study pattern: for each weekday, how many sessions and how long each one is.
 * Dates are New York calendar days as YYYY-MM-DD (see dates.ts).
 */
import { addDays, daysBetween } from "./dates";

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type WeekdayKey = (typeof WEEKDAYS)[number];

export const WEEKDAY_SHORT: Record<WeekdayKey, string> = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };
export const WEEKDAY_LONG: Record<WeekdayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export type DayPlan = { sessions: number; minutes: number };
export type Availability = { v: 1; days: Partial<Record<WeekdayKey, DayPlan>> };

export const MINUTE_OPTIONS = [15, 20, 30, 45, 60, 90, 120, 180] as const;
export const MIN_MINUTES = 15;
export const MAX_MINUTES = 180;
export const MAX_SESSIONS = 3;

/** Used until a student saves their own schedule: 30 minutes, Monday to Friday. */
export const DEFAULT_AVAILABILITY: Availability = {
  v: 1,
  days: { mon: { sessions: 1, minutes: 30 }, tue: { sessions: 1, minutes: 30 }, wed: { sessions: 1, minutes: 30 }, thu: { sessions: 1, minutes: 30 }, fri: { sessions: 1, minutes: 30 } },
};

export type AvailabilityResult = { ok: true; value: Availability } | { ok: false; error: string };

/** Checks and normalizes a pattern (from a form or the database). */
export function validateAvailability(raw: unknown): AvailabilityResult {
  if (typeof raw !== "object" || raw === null) return { ok: false, error: "Choose at least one study day." };
  const days = (raw as { days?: unknown }).days;
  if (typeof days !== "object" || days === null) return { ok: false, error: "Choose at least one study day." };
  const out: Availability = { v: 1, days: {} };
  for (const key of WEEKDAYS) {
    const d = (days as Record<string, unknown>)[key];
    if (d === undefined || d === null) continue;
    if (typeof d !== "object") return { ok: false, error: `Check the time for ${WEEKDAY_LONG[key]}.` };
    const sessions = Number((d as DayPlan).sessions);
    const minutes = Number((d as DayPlan).minutes);
    if (!Number.isInteger(sessions) || sessions < 1 || sessions > MAX_SESSIONS) {
      return { ok: false, error: `${WEEKDAY_LONG[key]}: choose 1 to ${MAX_SESSIONS} sessions.` };
    }
    if (!Number.isInteger(minutes) || minutes < MIN_MINUTES || minutes > MAX_MINUTES) {
      return { ok: false, error: `${WEEKDAY_LONG[key]}: sessions can be ${MIN_MINUTES} to ${MAX_MINUTES} minutes.` };
    }
    out.days[key] = { sessions, minutes };
  }
  if (Object.keys(out.days).length === 0) return { ok: false, error: "Choose at least one study day." };
  return { ok: true, value: out };
}

/** The stored pattern, or null if it's missing or invalid. */
export function parseAvailability(raw: unknown): Availability | null {
  const r = validateAvailability(raw);
  return r.ok ? r.value : null;
}

export function weekdayKey(iso: string): WeekdayKey {
  const [y, m, d] = iso.split("-").map(Number);
  const js = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  return WEEKDAYS[(js + 6) % 7];
}

export function dayPlan(av: Availability, iso: string): DayPlan | null {
  return av.days[weekdayKey(iso)] ?? null;
}

/** Planned minutes on a calendar day (0 if it isn't a study day). */
export function dayMinutes(av: Availability, iso: string): number {
  const p = dayPlan(av, iso);
  return p ? p.sessions * p.minutes : 0;
}

export function weeklyMinutes(av: Availability): number {
  return WEEKDAYS.reduce((m, k) => m + (av.days[k] ? av.days[k]!.sessions * av.days[k]!.minutes : 0), 0);
}

/** Study days from `from` (inclusive) up to `toExclusive`. */
export function studyDaysBetween(av: Availability, from: string, toExclusive: string): string[] {
  const out: string[] = [];
  const n = daysBetween(from, toExclusive);
  for (let i = 0; i < n; i++) {
    const day = addDays(from, i);
    if (dayMinutes(av, day) > 0) out.push(day);
  }
  return out;
}

export type Slot = { day: string; slot: number; minutes: number };

/** Every planned session between two days. */
export function plannedSlots(av: Availability, from: string, toExclusive: string): Slot[] {
  const out: Slot[] = [];
  for (const day of studyDaysBetween(av, from, toExclusive)) {
    const p = dayPlan(av, day)!;
    for (let s = 1; s <= p.sessions; s++) out.push({ day, slot: s, minutes: p.minutes });
  }
  return out;
}

export function formatMinutes(total: number): string {
  const m = Math.max(0, Math.round(total));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
}

/** "Mon–Fri · 1 × 30 min" when every study day is the same, otherwise one entry per day. */
export function describeAvailability(av: Availability): string {
  const keys = WEEKDAYS.filter((k) => av.days[k]);
  if (keys.length === 0) return "No study days";
  const plans = keys.map((k) => av.days[k]!);
  const same = plans.every((p) => p.sessions === plans[0].sessions && p.minutes === plans[0].minutes);
  const each = (p: DayPlan) => `${p.sessions} × ${p.minutes} min`;
  if (!same) {
    // Neighbouring days with the same plan read as one range: "Mon–Fri 1 × 30 min · Sat 1 × 60 min".
    const groups: WeekdayKey[][] = [];
    for (const k of keys) {
      const last = groups[groups.length - 1];
      const prev = last?.[last.length - 1];
      const p = av.days[k]!;
      const q = prev ? av.days[prev]! : null;
      if (last && q && WEEKDAYS.indexOf(k) === WEEKDAYS.indexOf(prev!) + 1 && q.sessions === p.sessions && q.minutes === p.minutes) last.push(k);
      else groups.push([k]);
    }
    const name = (g: WeekdayKey[]) =>
      g.length > 2 ? `${WEEKDAY_SHORT[g[0]]}–${WEEKDAY_SHORT[g[g.length - 1]]}` : g.map((k) => WEEKDAY_SHORT[k]).join(", ");
    return groups.map((g) => `${name(g)} ${each(av.days[g[0]]!)}`).join(" · ");
  }
  const idx = keys.map((k) => WEEKDAYS.indexOf(k));
  const consecutive = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
  const days = consecutive && keys.length > 2 ? `${WEEKDAY_SHORT[keys[0]]}–${WEEKDAY_SHORT[keys[keys.length - 1]]}` : keys.map((k) => WEEKDAY_SHORT[k]).join(", ");
  return `${days} · ${each(plans[0])}`;
}

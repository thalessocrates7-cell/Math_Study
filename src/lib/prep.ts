/**
 * The two study environments ("preparations") that share one student account:
 *  - exam4: the regular site (Integration Review: 4.10 and 5.1–5.7), at /dashboard, /plan, ...
 *  - final: the Final Exam preparation, the same pages under /final-exam.
 *
 * A problem belongs to exactly one preparation through its section (sections.preparation), so the
 * attempts, reviews and ticks on it are that preparation's records. Study sessions carry the
 * preparation themselves. Pure (no database), so pages, actions, the client nav and tests share it.
 */
import type { Difficulty } from "../../content/types";

export type Prep = "exam4" | "final";
export const PREPS: readonly Prep[] = ["exam4", "final"];

/** Where the Final Exam pages live. */
export const FINAL_BASE = "/final-exam";

/** Reads a preparation from a form or address value; anything unknown is the regular site. */
export function parsePrep(v: unknown): Prep {
  return v === "final" ? "final" : "exam4";
}

/** True for /final-exam and every page below it. */
export function isFinalPath(pathname: string): boolean {
  return pathname === FINAL_BASE || pathname.startsWith(`${FINAL_BASE}/`);
}

export const prepOfPath = (pathname: string): Prep => (isFinalPath(pathname) ? "final" : "exam4");

export type Routes = {
  prep: Prep;
  dashboard: string;
  plan: string;
  review: string;
  progress: string;
  session: string;
  settings: string;
  schedule: string;
  practice: (problemId: string) => string;
};

const ROUTES: Record<Prep, Routes> = {
  exam4: {
    prep: "exam4",
    dashboard: "/dashboard",
    plan: "/plan",
    review: "/review",
    progress: "/progress",
    session: "/session",
    settings: "/settings",
    schedule: "/schedule",
    practice: (id) => `/practice/${encodeURIComponent(id)}`,
  },
  final: {
    prep: "final",
    dashboard: FINAL_BASE,
    plan: `${FINAL_BASE}/plan`,
    review: `${FINAL_BASE}/review`,
    progress: `${FINAL_BASE}/progress`,
    session: `${FINAL_BASE}/session`,
    settings: `${FINAL_BASE}/settings`,
    schedule: `${FINAL_BASE}/schedule`,
    practice: (id) => `${FINAL_BASE}/practice/${encodeURIComponent(id)}`,
  },
};

export function routesFor(prep: Prep): Routes {
  return ROUTES[prep];
}

/** The page links a practice problem's address, by preparation (a review item, a session item, or plain). */
export function practiceLink(prep: Prep, problemId: string, q?: { item?: string; s?: string }): string {
  const base = ROUTES[prep].practice(problemId);
  if (q?.s) return `${base}?s=${q.s}`;
  if (q?.item) return `${base}?item=${q.item}`;
  return base;
}

// ---------------------------------------------------------------- returning to Integration Review

/** Cookie that remembers where the student was in the regular site when they opened Final Exam. */
export const RETURN_COOKIE = "mth_return";

/** Where "Integration Review" goes when no earlier place is remembered (or it isn't valid). */
export const RETURN_FALLBACK = "/dashboard";

const REGULAR_PAGE = /^\/(dashboard|plan|review|progress|session|settings|schedule|practice)(?=$|[/?#])/;

/**
 * A remembered return address, if it is a safe page of the regular site: a same-site path (never
 * "//host" or a full URL), not a Final Exam page, and not too long. Anything else gives null.
 */
export function safeReturnPath(raw: string | null | undefined): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 600) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return null;
  // Control characters never belong in a path.
  for (let i = 0; i < raw.length; i++) if (raw.charCodeAt(i) < 32) return null;
  if (isFinalPath(raw.split(/[?#]/)[0])) return null;
  return REGULAR_PAGE.test(raw) ? raw : null;
}

/** Reads the remembered address from a Cookie header string (document.cookie). */
export function returnPathFromCookies(cookieHeader: string): string {
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k !== RETURN_COOKIE) continue;
    try {
      return safeReturnPath(decodeURIComponent(v.join("="))) ?? RETURN_FALLBACK;
    } catch {
      return RETURN_FALLBACK;
    }
  }
  return RETURN_FALLBACK;
}

/** The Set-Cookie value (for document.cookie) remembering `path`; null when it isn't a safe page. */
export function returnCookieValue(path: string): string | null {
  const safe = safeReturnPath(path);
  if (!safe) return null;
  // A session cookie (no expiry): it lasts while the browser is open, across reloads and tabs.
  return `${RETURN_COOKIE}=${encodeURIComponent(safe)}; path=/; SameSite=Lax`;
}

// ---------------------------------------------------------------- exam time and countdown

/** "14:00" → "2:00 PM". Returns null for anything that isn't a 24-hour HH:MM time. */
export function formatExamTime(hhmm: string | null | undefined): string | null {
  const m = typeof hhmm === "string" ? /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm) : null;
  if (!m) return null;
  const h = Number(m[1]);
  const suffix = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m[2]} ${suffix}`;
}

export function isExamTime(v: string): boolean {
  return formatExamTime(v) !== null;
}

export type Countdown =
  | { kind: "days"; days: number }
  | { kind: "tomorrow" }
  | { kind: "today"; started: boolean }
  | { kind: "passed" };

/**
 * Days to the exam, counted in New York calendar days as everywhere else on the site. On the exam
 * day itself, `started` says whether the exam time has been reached (`nowHHMM` is New York time).
 */
export function countdownTo(today: string, examDate: string, opts: { nowHHMM?: string; examTime?: string | null } = {}): Countdown {
  const days = Math.round((Date.UTC(...ymd(examDate)) - Date.UTC(...ymd(today))) / 86_400_000);
  if (days > 1) return { kind: "days", days };
  if (days === 1) return { kind: "tomorrow" };
  if (days < 0) return { kind: "passed" };
  const started = !!(opts.examTime && opts.nowHHMM && isExamTime(opts.examTime) && opts.nowHHMM >= opts.examTime);
  return { kind: "today", started };
}

function ymd(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m - 1, d];
}

/** The short countdown line under the exam card ("Tomorrow at 2:00 PM", "Today at 2:00 PM", ...). */
export function countdownLabel(c: Countdown, timeText: string | null): string {
  const at = timeText ? ` at ${timeText}` : "";
  switch (c.kind) {
    case "days":
      return `${c.days} days remaining`;
    case "tomorrow":
      return `Tomorrow${at}`;
    case "today":
      return c.started ? "Exam time has passed" : `Today${at}`;
    case "passed":
      return "Exam date passed";
  }
}

// ---------------------------------------------------------------- display

/** Order of difficulty levels inside a Final Exam chapter's list. */
export const LEVEL_ORDER: Record<Difficulty, number> = { F: 0, C: 1, Ch: 2 };

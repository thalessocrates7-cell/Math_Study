/**
 * Every tunable number of the adaptive planner, with its default. Admins override any of them on the
 * Rules page (stored as a partial object in settings.rules); resolveRules() fills in the rest.
 */
export type Rules = {
  /** Default minutes per difficulty when a problem has no estimate of its own. */
  minutes: { F: number; C: number; Ch: number };
  /** Foundation problems that open the first unit (4.10) before Core. */
  foundationWarmups: number;
  /** Fewest new-learning problems a unit gets (if its pool has that many). */
  minPerUnit: number;
  /** The last study days before the exam are kept for cumulative review. */
  finalReviewDays: number;
  /** Share of a study day expected to go to reinforcement (used for sizing only). */
  expectedReinforcementShare: number;
  /** Share of a study day expected to go to look-backs, at most one Core problem (sizing only). */
  expectedLookbackShare: number;
  /** Most of a session that reinforcement may take, normally and when items are long overdue. */
  reinforcementCap: number;
  reinforcementCapOverdue: number;
  /** Reinforcement due this many days ago or more counts as long overdue. */
  overdueDays: number;
  /** Planned items may run over the session length by this fraction. */
  tolerance: number;
  lookback: {
    /** The previous unit is due after this many rated problems in a new unit. */
    bridgeAfter: number;
    /** A due look-back is placed after this many new problems in a session. */
    every: number;
    maxPerDay: number;
    /** Days with at least this many planned minutes allow maxPerDayLong look-backs. */
    longDayMinutes: number;
    maxPerDayLong: number;
    /** Gap in days for box 0, 1, 2, ... (the last value repeats). */
    intervals: number[];
    /** Multipliers on the gap: weak units sooner, building blocks sooner, demonstrated units later. */
    weakFactor: number;
    buildingBlockFactor: number;
    demonstratedFactor: number;
    /** A problem got right at least this many days ago can come back as a retention check. */
    retentionDays: number;
    /** Look-backs allowed per day during the final review days. */
    finalReviewPerDay: number;
    /** Most of a session one look-back may take (at least one Foundation problem), so short sessions get a short one. */
    share: number;
  };
  mastery: {
    /** The follow-up Got it must come at least this many calendar days after the first. */
    minDaysApart: number;
  };
  timing: {
    /** Attempts shorter than this don't teach the estimates. */
    minSeconds: number;
    /** Measured times are clamped to this multiple of the estimate. */
    maxFactor: number;
    /** Students needed before a problem's estimate blends toward the class's typical time. */
    classMin: number;
    /** Recent attempts used for a student's speed factor. */
    speedSamples: number;
    /** Pseudo-samples pulling the speed factor toward 1 while data is thin. */
    speedPrior: number;
    speedMin: number;
    speedMax: number;
    /** Most seconds a single timer save may add. */
    maxSecondsPerSave: number;
  };
};

export const DEFAULT_RULES: Rules = {
  minutes: { F: 5, C: 10, Ch: 15 },
  foundationWarmups: 2,
  minPerUnit: 2,
  finalReviewDays: 2,
  expectedReinforcementShare: 0.1,
  expectedLookbackShare: 0.15,
  reinforcementCap: 0.4,
  reinforcementCapOverdue: 0.6,
  overdueDays: 3,
  tolerance: 0.1,
  lookback: {
    bridgeAfter: 2,
    every: 3,
    maxPerDay: 1,
    longDayMinutes: 60,
    maxPerDayLong: 2,
    intervals: [2, 4, 7, 12, 20],
    weakFactor: 0.5,
    buildingBlockFactor: 0.75,
    demonstratedFactor: 1.25,
    retentionDays: 10,
    finalReviewPerDay: 4,
    share: 0.25,
  },
  mastery: { minDaysApart: 1 },
  timing: {
    minSeconds: 30,
    maxFactor: 3,
    classMin: 5,
    speedSamples: 20,
    speedPrior: 5,
    speedMin: 0.5,
    speedMax: 2,
    maxSecondsPerSave: 180,
  },
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends number[] ? number[] : T[K] extends object ? DeepPartial<T[K]> : T[K] };
export type RulesOverride = DeepPartial<Rules>;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Merges an override into the defaults, keeping only finite, non-negative numbers of the right shape. */
function merge<T>(base: T, over: unknown): T {
  if (!isPlainObject(over)) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, def] of Object.entries(base as Record<string, unknown>)) {
    const v = over[key];
    if (v === undefined) continue;
    if (typeof def === "number") {
      if (typeof v === "number" && Number.isFinite(v) && v >= 0) out[key] = v;
    } else if (Array.isArray(def)) {
      if (Array.isArray(v) && v.length > 0 && v.every((n) => typeof n === "number" && Number.isFinite(n) && n > 0)) out[key] = v;
    } else if (isPlainObject(def)) {
      out[key] = merge(def, v);
    }
  }
  return out as T;
}

export function resolveRules(override?: unknown): Rules {
  const r = merge(DEFAULT_RULES, override);
  // Keep the few values that must be at least 1 usable.
  r.minutes = { F: Math.max(1, r.minutes.F), C: Math.max(1, r.minutes.C), Ch: Math.max(1, r.minutes.Ch) };
  r.lookback = { ...r.lookback, every: Math.max(1, Math.round(r.lookback.every)) };
  r.timing = { ...r.timing, speedMin: Math.min(r.timing.speedMin, 1), speedMax: Math.max(r.timing.speedMax, 1) };
  return r;
}

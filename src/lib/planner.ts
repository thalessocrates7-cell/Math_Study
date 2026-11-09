/**
 * Sizing: how many new-learning problems each Exam 4 unit gets for this student, from the time they
 * have before the exam. Also the pacing status and a forecast of which units land on which days.
 *
 * Each remaining study day is split the way a real day goes: the daily Challenge (while on track),
 * some reinforcement, a look-back, and the rest for new Core problems. The last study days before
 * the exam are kept for cumulative review. If the minimum (2 per unit) doesn't fit with the daily
 * Challenge, the Challenge becomes an optional bonus; if it still doesn't fit, the student is behind.
 */
import type { Difficulty } from "../../content/types";
import { type Availability, dayMinutes, studyDaysBetween } from "./availability";
import { daysBetween } from "./dates";
import type { EngineUnit, LearningState } from "./learning-state";
import type { Rules } from "./rules";

export type UnitPlan = {
  unitId: string;
  title: string;
  /** Level of the unit's new-learning problems: Core, or the nearest level the pool has. */
  newLevel: Difficulty | null;
  /** Foundation warm-ups before Core (first unit only). */
  warmupTarget: number;
  warmupDone: number;
  /** New-learning problems planned for the unit (including those already done). */
  target: number;
  done: number;
  /** Active problems at the new-learning level. */
  pool: number;
  skills: number;
  /** The student moved on to a later unit, so the target is frozen at what they did. */
  closed: boolean;
  complete: boolean;
};

export type PacingStatus = "ahead" | "on_track" | "tight" | "behind";

export type Pacing = {
  status: PacingStatus;
  challengeMode: "daily" | "bonus";
  examDate: string;
  daysToExam: number;
  examPassed: boolean;
  /** Remaining study days before the exam (today included when it is one). */
  studyDays: string[];
  /** The final review days at the end of studyDays. */
  reviewDays: string[];
  finalReview: boolean;
  minutesLeft: number;
  /** New-learning problems that fit before the review days. */
  capacity: number;
  /** Problems still needed to reach the minimum in every unit. */
  needed: number;
  /** When behind: extra minutes a week that would cover the minimum. */
  extraWeeklyMinutes: number | null;
};

export type ForecastDay = { day: string; minutes: number; review: boolean; units: string[] };

export type PlanResult = {
  units: UnitPlan[];
  currentUnitId: string | null;
  pacing: Pacing;
  forecast: ForecastDay[];
  /** First and last forecast day of each unit's remaining new work. */
  unitDates: Map<string, { start: string; end: string }>;
};

export type PlanInput = {
  today: string;
  examDate: string;
  availability: Availability;
  minutesUsedToday: number;
  units: EngineUnit[];
  state: LearningState;
  rules: Rules;
  /** This student's minutes for a typical problem at each level. */
  levelMinutes: Record<Difficulty, number>;
  /** Today's daily Challenge already happened. */
  challengeDoneToday?: boolean;
  /** Share of study time this student actually spends on reinforcement (defaults to the rule). */
  reinforcementShare?: number;
};

export function computePlan(input: PlanInput): PlanResult {
  const { today, examDate, availability: av, rules, state, levelMinutes } = input;
  const core = input.units.filter((u) => u.kind === "core").sort((a, b) => a.sort - b.sort);
  const firstId = core[0]?.id;

  const plans: UnitPlan[] = core.map((u) => {
    const st = state.unitById.get(u.id);
    const act = st?.activeByLevel ?? { F: 0, C: 0, Ch: 0 };
    const learned = st?.newByLevel ?? { F: 0, C: 0, Ch: 0 };
    const unrated = st?.unratedByLevel ?? { F: 0, C: 0, Ch: 0 };
    const newLevel: Difficulty | null = act.C > 0 ? "C" : act.F > 0 ? "F" : act.Ch > 0 ? "Ch" : null;
    // Only new-learning work counts toward the unit (not reinforcement, look-backs or the Challenge).
    const done = newLevel ? learned[newLevel] : 0;
    const warmupTarget = u.id === firstId && newLevel === "C" ? Math.min(rules.foundationWarmups, act.F) : 0;
    // Starting straight on Core (e.g. from the section page) skips the warm-ups.
    const warmupDone = warmupTarget > 0 ? (done > 0 ? warmupTarget : Math.min(warmupTarget, learned.F)) : 0;
    // What the unit can still reach: what's done plus the problems never rated.
    const pool = newLevel ? done + unrated[newLevel] : 0;
    return { unitId: u.id, title: u.title, newLevel, warmupTarget, warmupDone, target: done, done, pool, skills: u.skills.length, closed: false, complete: false };
  });
  const minFor = (p: UnitPlan) => Math.min(rules.minPerUnit, p.pool);
  for (let i = 0; i < plans.length; i++) {
    const movedOn = plans.slice(i + 1).some((p) => state.unitById.get(p.unitId)?.introduced);
    plans[i].closed = movedOn && plans[i].done >= minFor(plans[i]) && plans[i].warmupDone >= plans[i].warmupTarget;
  }

  // Days and minutes.
  const daysToExam = daysBetween(today, examDate);
  const examPassed = daysToExam <= 0;
  const studyDays = examPassed ? [] : studyDaysBetween(av, today, examDate);
  const nReview = Math.min(rules.finalReviewDays, studyDays.length);
  const reviewDays = studyDays.slice(studyDays.length - nReview);
  const learningDays = studyDays.slice(0, studyDays.length - nReview);
  const plannedOn = (day: string) => (day === today ? Math.max(0, dayMinutes(av, day) - input.minutesUsedToday) : dayMinutes(av, day));
  const minutesLeft = studyDays.reduce((m, d) => m + plannedOn(d), 0);

  const newMinutesOn = (day: string, challenge: boolean) => {
    const full = dayMinutes(av, day);
    const planned = plannedOn(day);
    if (full <= 0 || planned <= 0) return 0;
    const challengeCost = challenge && !(day === today && input.challengeDoneToday) ? levelMinutes.Ch : 0;
    const reinforcement = full * (input.reinforcementShare ?? rules.expectedReinforcementShare);
    const overhead = challengeCost + reinforcement + Math.min(full * rules.expectedLookbackShare, levelMinutes.C);
    // Part of today may already be used; the overheads shrink with it.
    const scale = day === today ? planned / full : 1;
    return Math.max(0, planned - overhead * scale);
  };
  const warmupLeft = plans.reduce((m, p) => m + Math.max(0, p.warmupTarget - p.warmupDone), 0);
  const capacityFor = (challenge: boolean) => {
    const minutes = learningDays.reduce((m, d) => m + newMinutesOn(d, challenge), 0) - warmupLeft * levelMinutes.F;
    return Math.max(0, Math.floor(minutes / levelMinutes.C));
  };

  // Targets.
  const open = plans.filter((p) => !p.closed && p.newLevel);
  const floorOf = (p: UnitPlan) => Math.max(p.done, minFor(p));
  const needed = open.reduce((m, p) => m + (floorOf(p) - p.done), 0);
  const kDaily = capacityFor(true);
  const kBonus = capacityFor(false);
  let challengeMode: Pacing["challengeMode"] = "daily";
  let capacity = kDaily;
  let status: PacingStatus = "on_track";
  if (!examPassed && kDaily < needed) {
    challengeMode = "bonus";
    capacity = kBonus;
    status = kBonus >= needed ? "tight" : "behind";
  }
  // Spread the whole plan (what's done in the open units plus what still fits) by skill count. Using the
  // total, not just the leftover, keeps targets steady from day to day: each problem done uses up one
  // problem of capacity, so the current unit's target doesn't creep upward while the student is in it.
  const total = open.reduce((m, p) => m + p.done, 0) + capacity;
  const weight = open.reduce((m, p) => m + Math.max(1, p.skills), 0);
  const ideal = (p: UnitPlan) => (weight > 0 ? (total * Math.max(1, p.skills)) / weight : 0);
  for (const p of open) p.target = Math.min(p.pool, Math.max(floorOf(p), Math.floor(ideal(p))));
  let left = total - open.reduce((m, p) => m + p.target, 0);
  while (left > 0) {
    const room = open.filter((p) => p.target < p.pool);
    if (room.length === 0) break;
    const next = room.reduce((a, b) => (ideal(b) - b.target > ideal(a) - a.target ? b : a));
    next.target++;
    left--;
  }
  if (status === "on_track" && open.every((p) => p.target >= p.pool) && left >= 3) status = "ahead";
  for (const p of plans) p.complete = !p.newLevel || (p.warmupDone >= p.warmupTarget && p.done >= p.target);
  const currentUnitId = plans.find((p) => !p.complete)?.unitId ?? null;

  const weeks = Math.max(1, daysToExam / 7);
  const extraWeeklyMinutes =
    status === "behind" ? Math.max(15, Math.ceil(((needed - capacity) * levelMinutes.C) / weeks / 5) * 5) : null;

  // Forecast: hand the remaining new problems to the learning days in order.
  const queue: string[] = [];
  for (const p of plans) {
    const n = Math.max(0, p.warmupTarget - p.warmupDone) + Math.max(0, p.target - p.done);
    for (let i = 0; i < n; i++) queue.push(p.unitId);
  }
  const forecast: ForecastDay[] = [];
  const unitDates = new Map<string, { start: string; end: string }>();
  let qi = 0;
  for (const day of studyDays) {
    const review = reviewDays.includes(day);
    const units = new Set<string>();
    if (!review) {
      let mins = newMinutesOn(day, challengeMode === "daily");
      while (qi < queue.length && mins >= levelMinutes.C * 0.75) {
        const u = queue[qi++];
        units.add(u);
        const d = unitDates.get(u);
        unitDates.set(u, { start: d?.start ?? day, end: day });
        mins -= levelMinutes.C;
      }
    }
    forecast.push({ day, minutes: plannedOn(day), review, units: [...units] });
  }

  return {
    units: plans,
    currentUnitId,
    pacing: {
      status,
      challengeMode,
      examDate,
      daysToExam,
      examPassed,
      studyDays,
      reviewDays,
      finalReview: reviewDays.includes(today),
      minutesLeft,
      capacity,
      needed,
      extraWeeklyMinutes,
    },
    forecast,
    unitDates,
  };
}

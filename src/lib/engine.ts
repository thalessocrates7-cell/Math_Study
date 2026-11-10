/**
 * The adaptive planner in one place: from a student's history and schedule to their learning state,
 * plan, look-backs and next session. Pure (no database), so the server, the tests and the simulator
 * (dev/simulate.ts) all run exactly the same logic.
 */
import type { Difficulty } from "../../content/types";
import { type Availability, dayMinutes } from "./availability";
import { addDays } from "./dates";
import { baseMinutes, personalMinutes, refinedMinutes, speedFactor, type TimeStats } from "./estimates";
import {
  computeLearningState,
  type EngineAttempt,
  type EngineProblem,
  type EngineReview,
  type EngineUnit,
  type LearningState,
} from "./learning-state";
import { computePlan, type PlanResult } from "./planner";
import { lookbackSchedule, type LookbackSchedule } from "./regressive";
import type { Rules } from "./rules";
import { type BuildContext, type BuiltSession, buildSession, keepGoingOptions, type PlannedItem } from "./session-builder";

export type EngineInput = {
  today: string;
  examDate: string;
  availability: Availability;
  units: EngineUnit[];
  problems: EngineProblem[];
  attempts: EngineAttempt[];
  /** Pending targeted-reinforcement items. */
  reviews: EngineReview[];
  timeStats: Map<string, TimeStats>;
  rules: Rules;
  /** Stable per-student seed (the student id), so classmates get different problems. */
  seed: string;
  includeSupplementary: boolean;
  /** Problems the student ticked on the Study Plan. */
  ticked?: ReadonlySet<string>;
  minutesUsedToday?: number;
  challengeDoneToday?: boolean;
  skippedToday?: Set<string>;
  skippedRecent?: Map<string, number>;
};

export type StudentModel = {
  input: EngineInput;
  state: LearningState;
  speed: { factor: number; n: number };
  /** Personal minutes for a problem. */
  personal: (problemId: string) => number;
  levelMinutes: Record<Difficulty, number>;
  plan: PlanResult;
  lookbacks: LookbackSchedule;
  dayPlannedMinutes: number;
  context: BuildContext;
  /** Share of recent study time spent on reinforcement (used for sizing). */
  reinforcementShare: number;
};

export function computeModel(input: EngineInput): StudentModel {
  const { rules, problems } = input;
  const state = computeLearningState({ units: input.units, problems, attempts: input.attempts, reviews: input.reviews, rules });
  const byId = new Map(problems.map((p) => [p.id, p]));
  const refined = (p: EngineProblem) => refinedMinutes(baseMinutes(p, rules), input.timeStats.get(p.id), rules);

  const samples: Array<{ seconds: number; estimateMinutes: number }> = [];
  for (let i = state.rated.length - 1; i >= 0; i--) {
    const a = state.rated[i];
    const p = byId.get(a.problemId);
    if (p && a.activeSeconds > 0) samples.push({ seconds: a.activeSeconds, estimateMinutes: refined(p) });
  }
  const speed = speedFactor(samples, rules);
  const cache = new Map<string, number>();
  const personal = (id: string) => {
    let m = cache.get(id);
    if (m === undefined) {
      const p = byId.get(id);
      m = personalMinutes(p ? refined(p) : rules.minutes.C, speed.factor);
      cache.set(id, m);
    }
    return m;
  };
  const levelMinutes: Record<Difficulty, number> = {
    F: personalMinutes(rules.minutes.F, speed.factor),
    C: personalMinutes(rules.minutes.C, speed.factor),
    Ch: personalMinutes(rules.minutes.Ch, speed.factor),
  };

  // How much of this student's time really goes to reinforcement (last 14 days), pulled toward the
  // default while there are few study days, so sizing stays realistic for students who struggle.
  const since = addDays(input.today, -14);
  let reinforcementMinutes = 0;
  let totalMinutes = 0;
  const days = new Set<string>();
  for (const a of state.rated) {
    if (!a.ratedDay || a.ratedDay < since || a.ratedDay > input.today) continue;
    const p = byId.get(a.problemId);
    const m = a.activeSeconds > 0 ? a.activeSeconds / 60 : p ? refined(p) : rules.minutes.C;
    totalMinutes += m;
    if (a.origin === "review") reinforcementMinutes += m;
    days.add(a.ratedDay);
  }
  const observed = totalMinutes > 0 ? reinforcementMinutes / totalMinutes : rules.expectedReinforcementShare;
  const prior = 3;
  const reinforcementShare = Math.min(
    rules.reinforcementCapOverdue,
    Math.max(0.05, (prior * rules.expectedReinforcementShare + days.size * observed) / (prior + days.size)),
  );

  const plan = computePlan({
    today: input.today,
    examDate: input.examDate,
    availability: input.availability,
    minutesUsedToday: input.minutesUsedToday ?? 0,
    units: input.units,
    state,
    rules,
    levelMinutes,
    challengeDoneToday: input.challengeDoneToday,
    reinforcementShare,
  });
  const dayPlannedMinutes = dayMinutes(input.availability, input.today);
  const lookbacks = lookbackSchedule({
    today: input.today,
    units: input.units,
    problems,
    state,
    plan,
    rules,
    dayPlannedMinutes,
    includeSupplementary: input.includeSupplementary,
    skippedToday: input.skippedToday,
    skippedRecent: input.skippedRecent,
  });
  const context: BuildContext = {
    today: input.today,
    units: input.units,
    problems,
    state,
    plan,
    lookbacks,
    reviews: input.reviews,
    rules,
    seed: input.seed,
    ticked: input.ticked,
    personal,
    levelMinutes,
  };
  return { input, state, speed, personal, levelMinutes, plan, lookbacks, dayPlannedMinutes, context, reinforcementShare };
}

export function planSession(model: StudentModel, opts: { sessionMinutes: number; firstOfDay: boolean; exclude?: ReadonlySet<string> }): BuiltSession {
  return buildSession(model.context, opts);
}

export function extraOptions(model: StudentModel, taken: ReadonlySet<string>): PlannedItem[] {
  return keepGoingOptions(model.context, taken);
}

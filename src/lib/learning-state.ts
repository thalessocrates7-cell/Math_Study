/**
 * What a student has studied and understood, computed fresh from their history every time (never
 * stored, so it can't drift). Units are sections, skills are the concept tags, and a problem with
 * several tags counts as evidence for each of them.
 *
 * Skill states (display priority):
 *   Needs reinforcement  latest rating in the skill is Shaky or Lost, or a reinforcement item is open
 *   Demonstrated         Got it on a base-level problem (Core when the skill has one), then Got it on a
 *                        follow-up (Challenge when the skill has one, otherwise another base-level problem)
 *                        on a later day, without opening the worked solution either time
 *   Completed            rated at least one base-level problem
 *   Attempted            rated something, but no base-level problem yet
 *   Introduced           opened a problem, never rated
 *   Not started          nothing opened
 */
import type { Difficulty } from "../../content/types";
import { daysBetween } from "./dates";
import type { Rules } from "./rules";

export type RatingValue = "got_it" | "shaky" | "lost" | "skipped";
export type Origin = "plan" | "review" | "browse" | "challenge" | "lookback" | "extra";

export type EngineSkill = { id: string; label: string; prerequisites?: string[] };
export type EngineUnit = { id: string; title: string; sort: number; kind: "core" | "supplementary"; skills: EngineSkill[] };
export type EngineProblem = {
  id: string;
  unitId: string;
  difficulty: Difficulty;
  skills: string[];
  active: boolean;
  estMinutes: number | null;
  sort: number;
};
export type EngineAttempt = {
  id: string;
  problemId: string;
  origin: Origin;
  openedAt: Date;
  ratedAt: Date | null;
  ratedDay: string | null;
  rating: RatingValue | null;
  solutionViewed: boolean;
  hintsShown: number;
  answerRevealed: boolean;
  activeSeconds: number;
  sessionItemId: string | null;
};
export type ReinforcementReason = "got_it" | "shaky" | "lost" | "similar" | "easier";
export type EngineReview = {
  id: string;
  problemId: string;
  sourceProblemId: string | null;
  dueDate: string;
  reason: ReinforcementReason;
  createdAt: Date;
};

export const skillKey = (unitId: string, skillId: string) => `${unitId}:${skillId}`;

export type Coverage = "not_started" | "introduced" | "attempted" | "completed";
export type SkillState = Coverage | "needs_reinforcement" | "demonstrated";
export const SKILL_STATES: SkillState[] = ["not_started", "introduced", "attempted", "completed", "needs_reinforcement", "demonstrated"];

export type SkillStatus = {
  key: string;
  id: string;
  unitId: string;
  label: string;
  coverage: Coverage;
  demonstrated: boolean;
  /**
   * The mastery evidence is there (since the last Shaky/Lost), even if a reinforcement item is still
   * open. Used to close reinforcement that is no longer needed.
   */
  evidenceMet: boolean;
  needsReinforcement: boolean;
  state: SkillState;
  /** Level whose Got it starts the mastery check (Core when the skill has Core problems). */
  baseLevel: Difficulty | null;
  /** Level of the follow-up (Challenge when the skill has one, otherwise the base level again). */
  followLevel: Difficulty | null;
  rated: number;
  latest: RatingValue | null;
  latestAt: Date | null;
  latestDay: string | null;
  lastWeak: { rating: "shaky" | "lost"; day: string; at: Date } | null;
  /** Problems with this skill the student rated at the base level (distinct). */
  baseRated: number;
};

export type UnitStatus = {
  id: string;
  title: string;
  kind: "core" | "supplementary";
  sort: number;
  opened: boolean;
  /** At least one rated problem: only introduced units can come back in look-backs. */
  introduced: boolean;
  ratedByLevel: Record<Difficulty, number>;
  /** Distinct problems rated as new learning (plan, browse, Keep going): what counts toward the unit's plan. */
  newByLevel: Record<Difficulty, number>;
  firstRatedAt: Date | null;
  lastRatedDay: string | null;
  skills: SkillStatus[];
  counts: Record<SkillState, number>;
  /** Every skill demonstrated, never just "a few problems done". */
  demonstrated: boolean;
  activeByLevel: Record<Difficulty, number>;
  /** Active problems the student has never rated, per level (what new learning can still use). */
  unratedByLevel: Record<Difficulty, number>;
};

export type ProblemSummary = {
  opened: boolean;
  ratedCount: number;
  latest: RatingValue | null;
  latestAt: Date | null;
  latestDay: string | null;
  /** Day of the most recent Got it without the worked solution. */
  lastCleanGotItDay: string | null;
};

export type LearningState = {
  skills: Map<string, SkillStatus>;
  units: UnitStatus[];
  unitById: Map<string, UnitStatus>;
  problems: Map<string, ProblemSummary>;
  /** Rated attempts, oldest first. */
  rated: EngineAttempt[];
};

const isRated = (a: EngineAttempt) => a.ratedAt !== null && a.rating !== null && a.rating !== "skipped" && a.ratedDay !== null;
const isClean = (a: EngineAttempt) => a.rating === "got_it" && !a.solutionViewed;
const REINFORCING = new Set<ReinforcementReason>(["shaky", "lost", "similar", "easier"]);
/** Origins that count as working through a unit's material (not reinforcement, look-backs or the Challenge). */
const NEW_LEARNING = new Set<Origin>(["plan", "browse", "extra"]);

/** Pending reinforcement whose problem's skills are all demonstrated now: no longer needed. */
export function supersededReviewIds(state: LearningState, reviews: EngineReview[], problems: EngineProblem[]): string[] {
  const byId = new Map(problems.map((p) => [p.id, p]));
  const out: string[] = [];
  for (const r of reviews) {
    if (!REINFORCING.has(r.reason)) continue;
    const p = byId.get(r.problemId);
    if (!p || p.skills.length === 0) continue;
    // Open reinforcement itself marks a skill "needs reinforcement", so look at the evidence instead.
    if (p.skills.every((s) => state.skills.get(skillKey(p.unitId, s))?.evidenceMet)) out.push(r.id);
  }
  return out;
}

function emptyCounts(): Record<SkillState, number> {
  return { not_started: 0, introduced: 0, attempted: 0, completed: 0, needs_reinforcement: 0, demonstrated: 0 };
}

export function computeLearningState(input: {
  units: EngineUnit[];
  problems: EngineProblem[];
  attempts: EngineAttempt[];
  reviews: EngineReview[];
  rules: Rules;
}): LearningState {
  const { units, problems, attempts, reviews, rules } = input;
  const byId = new Map(problems.map((p) => [p.id, p]));
  const rated = attempts.filter(isRated).sort((a, b) => a.ratedAt!.getTime() - b.ratedAt!.getTime());

  // Per problem.
  const summaries = new Map<string, ProblemSummary>();
  const summary = (id: string) => {
    let s = summaries.get(id);
    if (!s) {
      s = { opened: false, ratedCount: 0, latest: null, latestAt: null, latestDay: null, lastCleanGotItDay: null };
      summaries.set(id, s);
    }
    return s;
  };
  for (const a of attempts) summary(a.problemId).opened = true;
  for (const a of rated) {
    const s = summary(a.problemId);
    s.ratedCount++;
    s.latest = a.rating;
    s.latestAt = a.ratedAt;
    s.latestDay = a.ratedDay;
    if (isClean(a)) s.lastCleanGotItDay = a.ratedDay;
  }

  // Which skills have open reinforcement.
  const reinforcing = new Set<string>();
  for (const r of reviews) {
    if (!REINFORCING.has(r.reason)) continue;
    const p = byId.get(r.problemId);
    if (p) for (const s of p.skills) reinforcing.add(skillKey(p.unitId, s));
  }

  // Active pool levels per skill and per unit.
  const levelsBySkill = new Map<string, Set<Difficulty>>();
  const activeByUnit = new Map<string, Record<Difficulty, number>>();
  for (const p of problems) {
    if (!p.active) continue;
    const counts = activeByUnit.get(p.unitId) ?? { F: 0, C: 0, Ch: 0 };
    counts[p.difficulty]++;
    activeByUnit.set(p.unitId, counts);
    for (const s of p.skills) {
      const k = skillKey(p.unitId, s);
      const set = levelsBySkill.get(k) ?? new Set<Difficulty>();
      set.add(p.difficulty);
      levelsBySkill.set(k, set);
    }
  }
  const activeCountAt = (key: string, level: Difficulty) =>
    problems.filter((p) => p.active && p.difficulty === level && p.skills.some((s) => skillKey(p.unitId, s) === key)).length;

  // Rated attempts and opened problems per skill.
  const ratedBySkill = new Map<string, EngineAttempt[]>();
  const openedSkills = new Set<string>();
  for (const a of attempts) {
    const p = byId.get(a.problemId);
    if (p) for (const s of p.skills) openedSkills.add(skillKey(p.unitId, s));
  }
  for (const a of rated) {
    const p = byId.get(a.problemId);
    if (!p) continue;
    for (const s of p.skills) {
      const k = skillKey(p.unitId, s);
      const list = ratedBySkill.get(k) ?? [];
      list.push(a);
      ratedBySkill.set(k, list);
    }
  }

  const skills = new Map<string, SkillStatus>();
  const unitStatuses: UnitStatus[] = [];
  for (const u of [...units].sort((a, b) => a.sort - b.sort)) {
    const unitSkills: SkillStatus[] = [];
    for (const sk of u.skills) {
      const key = skillKey(u.id, sk.id);
      const levels = levelsBySkill.get(key) ?? new Set<Difficulty>();
      const baseLevel: Difficulty | null = levels.has("C") ? "C" : levels.has("F") ? "F" : levels.has("Ch") ? "Ch" : null;
      const followLevel: Difficulty | null = baseLevel && levels.has("Ch") && baseLevel !== "Ch" ? "Ch" : baseLevel;
      const list = ratedBySkill.get(key) ?? [];
      const latest = list.length ? list[list.length - 1] : null;
      let lastWeak: SkillStatus["lastWeak"] = null;
      for (const a of list) if (a.rating === "shaky" || a.rating === "lost") lastWeak = { rating: a.rating, day: a.ratedDay!, at: a.ratedAt! };

      const levelOf = (a: EngineAttempt) => byId.get(a.problemId)?.difficulty;
      const baseRated = new Set(list.filter((a) => baseLevel === null || levelOf(a) === baseLevel).map((a) => a.problemId)).size;
      const coverage: Coverage = list.length > 0 ? (baseRated > 0 ? "completed" : "attempted") : openedSkills.has(key) ? "introduced" : "not_started";

      // Mastery: only evidence after the most recent Shaky/Lost counts.
      let demonstrated = false;
      if (baseLevel && followLevel) {
        const evidence = list.filter((a) => isClean(a) && (!lastWeak || a.ratedAt!.getTime() > lastWeak.at.getTime()));
        const bases = evidence.filter((a) => levelOf(a) === baseLevel);
        const sameLevel = followLevel === baseLevel;
        const onlyOneAtBase = activeCountAt(key, baseLevel) <= 1;
        outer: for (const b of bases) {
          for (const f of evidence) {
            if (levelOf(f) !== followLevel) continue;
            if (daysBetween(b.ratedDay!, f.ratedDay!) < rules.mastery.minDaysApart) continue;
            if (sameLevel && f.problemId === b.problemId && !onlyOneAtBase) continue;
            demonstrated = true;
            break outer;
          }
        }
      }
      const needsReinforcement = latest?.rating === "shaky" || latest?.rating === "lost" || reinforcing.has(key);
      const state: SkillState = needsReinforcement ? "needs_reinforcement" : demonstrated ? "demonstrated" : coverage;
      const status: SkillStatus = {
        key,
        id: sk.id,
        unitId: u.id,
        label: sk.label,
        coverage,
        demonstrated: demonstrated && !needsReinforcement,
        evidenceMet: demonstrated,
        needsReinforcement,
        state,
        baseLevel,
        followLevel,
        rated: list.length,
        latest: latest?.rating ?? null,
        latestAt: latest?.ratedAt ?? null,
        latestDay: latest?.ratedDay ?? null,
        lastWeak,
        baseRated,
      };
      skills.set(key, status);
      unitSkills.push(status);
    }

    const unitRated = rated.filter((a) => byId.get(a.problemId)?.unitId === u.id);
    const ratedByLevel: Record<Difficulty, number> = { F: 0, C: 0, Ch: 0 };
    const newByLevel: Record<Difficulty, number> = { F: 0, C: 0, Ch: 0 };
    const seen = new Set<string>();
    const seenNew = new Set<string>();
    for (const a of unitRated) {
      const level = byId.get(a.problemId)!.difficulty;
      if (!seen.has(a.problemId)) {
        seen.add(a.problemId);
        ratedByLevel[level]++;
      }
      if (NEW_LEARNING.has(a.origin) && !seenNew.has(a.problemId)) {
        seenNew.add(a.problemId);
        newByLevel[level]++;
      }
    }
    const unratedByLevel: Record<Difficulty, number> = { F: 0, C: 0, Ch: 0 };
    for (const p of problems) if (p.active && p.unitId === u.id && !(summaries.get(p.id)?.ratedCount)) unratedByLevel[p.difficulty]++;
    const counts = emptyCounts();
    for (const s of unitSkills) counts[s.state]++;
    unitStatuses.push({
      id: u.id,
      title: u.title,
      kind: u.kind,
      sort: u.sort,
      opened: attempts.some((a) => byId.get(a.problemId)?.unitId === u.id),
      introduced: unitRated.length > 0,
      ratedByLevel,
      newByLevel,
      firstRatedAt: unitRated[0]?.ratedAt ?? null,
      lastRatedDay: unitRated.length ? unitRated[unitRated.length - 1].ratedDay : null,
      skills: unitSkills,
      counts,
      demonstrated: unitSkills.length > 0 && unitSkills.every((s) => s.demonstrated),
      activeByLevel: activeByUnit.get(u.id) ?? { F: 0, C: 0, Ch: 0 },
      unratedByLevel,
    });
  }

  return { skills, units: unitStatuses, unitById: new Map(unitStatuses.map((u) => [u.id, u])), problems: summaries, rated };
}

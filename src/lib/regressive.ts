/**
 * Regressive Study ("look-backs"): one problem from an earlier unit, so it doesn't fade.
 *
 *  - Bridge check: after the student rates their first few problems in a new unit, the previous unit
 *    is due for one look-back.
 *  - Spaced returns: every earlier unit the student has studied comes back on its own, at growing
 *    gaps (box 0, 1, 2, ... = 2, 4, 7, 12, 20 days), sooner when it's weak or a building block of the
 *    current unit, later when every studied skill in it is demonstrated.
 *  - Only units with at least one rated problem are eligible: unstudied material is never "reviewed".
 *  - In the final review days before the exam, every studied unit is due.
 */
import { addDays, daysBetween } from "./dates";
import type { EngineProblem, EngineReview, EngineUnit, LearningState, SkillStatus } from "./learning-state";
import { skillKey } from "./learning-state";
import type { PlanResult } from "./planner";
import { hashString } from "./random";
import type { Reason } from "./reasons";
import type { Rules } from "./rules";

export type LookbackUnit = {
  unitId: string;
  box: number;
  dueDay: string;
  due: boolean;
  bridge: boolean;
  final: boolean;
  weak: boolean;
  buildingBlock: boolean;
  demonstrated: boolean;
  lastStudyDay: string | null;
  overdueDays: number;
  score: number;
  reason: Reason;
};

export type LookbackSchedule = {
  units: LookbackUnit[];
  /** Due now, most urgent first. */
  due: LookbackUnit[];
  /** Not due yet, soonest first. */
  upcoming: LookbackUnit[];
  doneToday: number;
  allowedToday: number;
  remainingToday: number;
};

export type LookbackInput = {
  today: string;
  units: EngineUnit[];
  problems: EngineProblem[];
  state: LearningState;
  plan: PlanResult;
  rules: Rules;
  /** Planned minutes today (long days allow a second look-back). */
  dayPlannedMinutes: number;
  includeSupplementary: boolean;
  /** Units whose look-back the student skipped today (not offered again today). */
  skippedToday?: Set<string>;
  /** Skips per unit in the last few days (each one bumps the unit's priority a little). */
  skippedRecent?: Map<string, number>;
};

const REINFORCING = new Set(["shaky", "lost", "similar", "easier"]);

/** Units whose skills the given unit's skills build on (from the skill map), excluding itself. */
export function unitsBuiltOn(unit: EngineUnit | undefined): Set<string> {
  const out = new Set<string>();
  if (!unit) return out;
  for (const s of unit.skills) for (const p of s.prerequisites ?? []) {
    const u = p.split(":")[0];
    if (u && u !== unit.id) out.add(u);
  }
  return out;
}

/** Skill keys of `unitId` that the given unit's skills build on. */
function buildingBlockSkills(current: EngineUnit | undefined, unitId: string): Set<string> {
  const out = new Set<string>();
  if (!current) return out;
  for (const s of current.skills) for (const p of s.prerequisites ?? []) if (p.startsWith(`${unitId}:`)) out.add(p);
  return out;
}

export function lookbackSchedule(input: LookbackInput): LookbackSchedule {
  const { today, units, problems, state, plan, rules } = input;
  const lb = rules.lookback;
  const unitById = new Map(units.map((u) => [u.id, u]));
  const byId = new Map(problems.map((p) => [p.id, p]));
  const current = plan.currentUnitId ? unitById.get(plan.currentUnitId) : undefined;
  const core = units.filter((u) => u.kind === "core").sort((a, b) => a.sort - b.sort);
  const currentIndex = current ? core.findIndex((u) => u.id === current.id) : core.length;
  const previousId = current && currentIndex > 0 ? core[currentIndex - 1].id : null;
  const builtOn = unitsBuiltOn(current);
  const final = plan.pacing.finalReview;

  // Look-back attempts per unit, oldest first.
  const lookbacksByUnit = new Map<string, typeof state.rated>();
  for (const a of state.rated) {
    if (a.origin !== "lookback") continue;
    const u = byId.get(a.problemId)?.unitId;
    if (!u) continue;
    const list = lookbacksByUnit.get(u) ?? [];
    list.push(a);
    lookbacksByUnit.set(u, list);
  }
  const doneToday = state.rated.filter((a) => a.origin === "lookback" && a.ratedDay === today).length;

  // Rated problems in the current unit, and when the student started it.
  const currentRated = current ? state.rated.filter((a) => byId.get(a.problemId)?.unitId === current.id) : [];
  const currentStart = currentRated[0]?.ratedAt ?? null;

  const out: LookbackUnit[] = [];
  for (const u of units) {
    const st = state.unitById.get(u.id);
    if (!st || !st.introduced || u.id === current?.id) continue;
    if (u.kind === "supplementary" && !input.includeSupplementary) continue;
    // Only earlier units (a unit the student merely peeked at ahead isn't "previously covered").
    if (u.kind === "core" && current && core.findIndex((c) => c.id === u.id) > currentIndex) continue;

    let box = 0;
    const history = lookbacksByUnit.get(u.id) ?? [];
    for (const a of history) {
      if (a.rating === "got_it" && !a.solutionViewed) box++;
      else if (a.rating === "lost") box = 0;
    }
    const lastStudyDay = st.lastRatedDay;
    const studiedSkills = st.skills.filter((s) => s.rated > 0);
    const recentLost = state.rated.some(
      (a) => a.rating === "lost" && byId.get(a.problemId)?.unitId === u.id && a.ratedDay !== null && daysBetween(a.ratedDay, today) <= 7,
    );
    const weak = studiedSkills.some((s) => s.needsReinforcement) || recentLost;
    const buildingBlock = builtOn.has(u.id);
    const demonstrated = studiedSkills.length > 0 && studiedSkills.every((s) => s.demonstrated);
    const interval = lb.intervals[Math.min(box, lb.intervals.length - 1)];
    const factor = (weak ? lb.weakFactor : 1) * (buildingBlock ? lb.buildingBlockFactor : 1) * (demonstrated ? lb.demonstratedFactor : 1);
    const gap = Math.max(1, Math.round(interval * factor));
    let dueDay = lastStudyDay ? addDays(lastStudyDay, gap) : today;

    const lookbackSinceStart = currentStart ? history.some((a) => a.ratedAt!.getTime() >= currentStart.getTime()) : false;
    const bridge = u.id === previousId && currentRated.length >= lb.bridgeAfter && !lookbackSinceStart;
    if (bridge || final) dueDay = dueDay < today ? dueDay : today;
    const due = (bridge || final || dueDay <= today) && !(input.skippedToday?.has(u.id) ?? false);
    const overdueDays = Math.max(0, daysBetween(dueDay, today));
    const since = lastStudyDay ? daysBetween(lastStudyDay, today) : 0;
    const skips = input.skippedRecent?.get(u.id) ?? 0;
    const score = overdueDays + (weak ? 2 : 0) + (buildingBlock ? 1.5 : 0) + 0.05 * since + (bridge ? 3 : 0) + 0.5 * skips;

    let reason: Reason;
    const weakest = mostRecentWeak(studiedSkills);
    if (bridge && current) reason = { code: "lookback_bridge", params: { unit: u.id, current: current.id } };
    else if (final) reason = { code: "lookback_final", params: { unit: u.id } };
    else if (weakest) reason = { code: "lookback_weak", params: { unit: u.id, skill: weakest.key, rating: weakest.lastWeak!.rating, day: weakest.lastWeak!.day } };
    else if (buildingBlock && current) reason = { code: "lookback_building_block", params: { unit: u.id, current: current.id } };
    else reason = { code: "lookback_due", params: { unit: u.id, days: since } };

    out.push({ unitId: u.id, box, dueDay, due, bridge, final, weak, buildingBlock, demonstrated, lastStudyDay, overdueDays, score, reason });
  }

  const allowedToday = final ? lb.finalReviewPerDay : input.dayPlannedMinutes >= lb.longDayMinutes ? lb.maxPerDayLong : lb.maxPerDay;
  return {
    units: out,
    due: out.filter((u) => u.due).sort((a, b) => b.score - a.score || a.unitId.localeCompare(b.unitId)),
    upcoming: out.filter((u) => !u.due).sort((a, b) => a.dueDay.localeCompare(b.dueDay) || b.score - a.score),
    doneToday,
    allowedToday,
    remainingToday: Math.max(0, allowedToday - doneToday),
  };
}

function mostRecentWeak(skills: SkillStatus[]): SkillStatus | null {
  let best: SkillStatus | null = null;
  for (const s of skills) {
    if (!s.lastWeak || !s.needsReinforcement) continue;
    if (!best || s.lastWeak.at.getTime() > best.lastWeak!.at.getTime()) best = s;
  }
  return best;
}

export type LookbackPick = { problemId: string; minutes: number; retentionDay: string | null };

/** Chooses the look-back problem for a unit: a weak, building-block or long-unseen skill first. */
export function pickLookbackProblem(input: {
  unitId: string;
  today: string;
  units: EngineUnit[];
  problems: EngineProblem[];
  state: LearningState;
  reviews: EngineReview[];
  rules: Rules;
  seed: string;
  currentUnitId: string | null;
  personal: (problemId: string) => number;
  maxMinutes: number;
  taken: ReadonlySet<string>;
  /** Problems ticked on the Study Plan: an unseen pick prefers ones that aren't. */
  ticked?: ReadonlySet<string>;
}): LookbackPick | null {
  const { unitId, today, state, rules, seed } = input;
  const st = state.unitById.get(unitId);
  if (!st) return null;
  const current = input.units.find((u) => u.id === input.currentUnitId);
  const blocks = buildingBlockSkills(current, unitId);
  const pendingIds = new Set(input.reviews.filter((r) => REINFORCING.has(r.reason)).map((r) => r.problemId));
  const byId = new Map(input.problems.map((p) => [p.id, p]));
  const reinforcingSkills = new Set<string>();
  for (const id of pendingIds) {
    const p = byId.get(id);
    if (p) for (const s of p.skills) reinforcingSkills.add(skillKey(p.unitId, s));
  }

  const studied = st.skills.filter((s) => s.rated > 0);
  const weight = (s: SkillStatus) =>
    (s.needsReinforcement ? 2 : 0) + (blocks.has(s.key) ? 1 : 0) + 0.1 * (s.latestDay ? daysBetween(s.latestDay, today) : 0) - (s.demonstrated ? 0.5 : 0);
  const order = [...studied].sort((a, b) => weight(b) - weight(a) || hashString(`${seed}:${a.key}`) - hashString(`${seed}:${b.key}`));
  // Skills that already have reinforcement pending go last, so the two tracks don't double up.
  const skills = [...order.filter((s) => !reinforcingSkills.has(s.key)), ...order.filter((s) => reinforcingSkills.has(s.key))];

  const usable = (p: EngineProblem) => p.active && p.unitId === unitId && !input.taken.has(p.id) && !pendingIds.has(p.id);
  const withSkill = (s: SkillStatus) => input.problems.filter((p) => usable(p) && p.skills.some((k) => skillKey(p.unitId, k) === s.key));
  const rated = (id: string) => (state.problems.get(id)?.ratedCount ?? 0) > 0;
  const shuffle = (a: EngineProblem, b: EngineProblem) => hashString(`${seed}:lb:${a.id}`) - hashString(`${seed}:lb:${b.id}`);
  const fits = (p: EngineProblem) => input.personal(p.id) <= input.maxMinutes;
  const pick = (p: EngineProblem, retentionDay: string | null = null): LookbackPick => ({ problemId: p.id, minutes: input.personal(p.id), retentionDay });

  for (const s of skills) {
    const cands = withSkill(s);
    const level = s.baseLevel ?? "C";
    // 1. A problem at the skill's base level they haven't done: tests transfer.
    const isTicked = (p: EngineProblem) => Number(input.ticked?.has(p.id) ?? false);
    const fresh = cands.filter((p) => p.difficulty === level && !rated(p.id)).sort((a, b) => isTicked(a) - isTicked(b) || shuffle(a, b));
    const fittingFresh = fresh.find(fits);
    if (fittingFresh) return pick(fittingFresh);
    // 2. Something they got right a while ago: a retention check.
    const retention = cands
      .filter((p) => {
        const sum = state.problems.get(p.id);
        return sum?.latest === "got_it" && sum.lastCleanGotItDay !== null && daysBetween(sum.lastCleanGotItDay, today) >= rules.lookback.retentionDays;
      })
      .sort((a, b) => state.problems.get(a.id)!.lastCleanGotItDay!.localeCompare(state.problems.get(b.id)!.lastCleanGotItDay!));
    const fittingRetention = retention.find(fits);
    if (fittingRetention) return pick(fittingRetention, state.problems.get(fittingRetention.id)!.lastCleanGotItDay);
    // 3. The one seen longest ago.
    const old = cands
      .filter((p) => rated(p.id))
      .sort((a, b) => (state.problems.get(a.id)!.latestDay ?? "").localeCompare(state.problems.get(b.id)!.latestDay ?? ""));
    const fittingOld = old.find(fits);
    if (fittingOld) return pick(fittingOld);
    // Short on time: a Foundation problem in that skill.
    const foundation = cands.filter((p) => p.difficulty === "F" && fits(p)).sort((a, b) => Number(rated(a.id)) - Number(rated(b.id)) || shuffle(a, b));
    if (foundation[0]) return pick(foundation[0]);
  }
  return null;
}

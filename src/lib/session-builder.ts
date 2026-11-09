/**
 * Builds one study session from the student's time and state. The daily flow (first session of a day):
 *
 *   1. Yesterday's Challenge: one Challenge problem on a skill from the previous study day's Core
 *      problems rated Got it without the worked solution. If the skill has no Challenge problem, a
 *      second Core problem; if that Got it needed the worked solution, another Core problem. Skipped
 *      when everything was Shaky or Lost (reinforcement covers it). A bonus when the student is behind.
 *   2. Targeted reinforcement that is due (an "easier" follow-up first), capped so new work moves.
 *   3. New learning in the current unit (4.10 opens with Foundation warm-ups), by value per minute.
 *   4. A due look-back, placed after a few new problems (or at the end of a short session).
 *
 * Items are added while they fit the session length (with a small tolerance); nothing longer than the
 * whole session is ever chosen. Later sessions the same day skip step 1.
 */
import type { Difficulty } from "../../content/types";
import { daysBetween, todayISO } from "./dates";
import type { EngineProblem, EngineReview, EngineUnit, LearningState, SkillStatus } from "./learning-state";
import { skillKey } from "./learning-state";
import type { PlanResult } from "./planner";
import { hashString } from "./random";
import type { Reason, Track } from "./reasons";
import { type LookbackSchedule, pickLookbackProblem } from "./regressive";
import type { Rules } from "./rules";

export type PlannedItem = {
  track: Track;
  problemId: string;
  reviewItemId: string | null;
  reason: Reason;
  minutes: number;
  essential: boolean;
};

export type BuildContext = {
  today: string;
  units: EngineUnit[];
  problems: EngineProblem[];
  state: LearningState;
  plan: PlanResult;
  lookbacks: LookbackSchedule;
  /** Pending reinforcement items. */
  reviews: EngineReview[];
  rules: Rules;
  seed: string;
  personal: (problemId: string) => number;
  /** This student's minutes for a typical problem at each level. */
  levelMinutes: Record<Difficulty, number>;
};

const REINFORCING = new Set(["shaky", "lost", "similar", "easier"]);

function pendingProblemIds(ctx: BuildContext): Set<string> {
  return new Set(ctx.reviews.filter((r) => REINFORCING.has(r.reason)).map((r) => r.problemId));
}

const ratedCount = (ctx: BuildContext, id: string) => ctx.state.problems.get(id)?.ratedCount ?? 0;

/** Weight of covering a skill again: uncovered skills count most, demonstrated ones barely. */
function skillWeight(s: SkillStatus | undefined, coveredNow: ReadonlySet<string>): number {
  if (!s) return 0;
  if (coveredNow.has(s.key)) return 0.05;
  if (s.coverage !== "completed") return 1;
  if (s.needsReinforcement) return 0.6;
  if (s.demonstrated) return 0.05;
  return 0.3 / (1 + s.baseRated);
}

/** The best unseen problem at a level in a unit, by uncovered skills per minute (resuming an open one first). */
function bestNewProblem(
  ctx: BuildContext,
  unitId: string,
  level: Difficulty,
  taken: ReadonlySet<string>,
  coveredNow: ReadonlySet<string>,
  maxMinutes: number,
  pending: ReadonlySet<string>,
): { problem: EngineProblem; topSkill: string | null } | null {
  let best: { problem: EngineProblem; topSkill: string | null; score: number; tie: number } | null = null;
  for (const p of ctx.problems) {
    if (!p.active || p.unitId !== unitId || p.difficulty !== level || taken.has(p.id) || pending.has(p.id)) continue;
    if (ratedCount(ctx, p.id) > 0) continue;
    const minutes = ctx.personal(p.id);
    if (minutes > maxMinutes) continue;
    let value = 0;
    let topSkill: string | null = null;
    let topWeight = -1;
    for (const s of p.skills) {
      const key = skillKey(p.unitId, s);
      const w = skillWeight(ctx.state.skills.get(key), coveredNow);
      value += w;
      if (w > topWeight) {
        topWeight = w;
        topSkill = key;
      }
    }
    const open = ctx.state.problems.get(p.id)?.opened ? 10 : 0;
    const score = value / minutes + open;
    const tie = hashString(`${ctx.seed}:new:${p.id}`);
    if (!best || score > best.score || (score === best.score && tie < best.tie)) best = { problem: p, topSkill, score, tie };
  }
  return best ? { problem: best.problem, topSkill: best.topSkill } : null;
}

/** New-learning problems that fit `maxMinutes`, in plan order (from the current unit onward). */
export function pickNewLearning(ctx: BuildContext, maxMinutes: number, taken: Set<string>, opts: { beyondPlan?: boolean; maxCount?: number } = {}): PlannedItem[] {
  const out: PlannedItem[] = [];
  const pending = pendingProblemIds(ctx);
  const covered = new Set<string>();
  let budget = maxMinutes;
  const limit = opts.maxCount ?? Number.POSITIVE_INFINITY;
  const add = (p: EngineProblem, track: Track, reason: Reason) => {
    const minutes = ctx.personal(p.id);
    out.push({ track, problemId: p.id, reviewItemId: null, reason, minutes, essential: !opts.beyondPlan });
    taken.add(p.id);
    for (const s of p.skills) covered.add(skillKey(p.unitId, s));
    budget -= minutes;
  };

  if (ctx.plan.pacing.finalReview && !opts.beyondPlan) {
    // Final review days: only skills the student has never studied get a new problem. Units never
    // opened come first, and a problem that covers several unstudied skills beats one that covers one.
    const coreUnits = new Set(ctx.plan.units.map((u) => u.unitId));
    while (out.length < limit) {
      let best: { p: EngineProblem; skill: string; score: number; tie: number } | null = null;
      for (const p of ctx.problems) {
        if (!p.active || !coreUnits.has(p.unitId) || taken.has(p.id) || pending.has(p.id) || ratedCount(ctx, p.id) > 0) continue;
        const minutes = ctx.personal(p.id);
        if (minutes > budget) continue;
        const neverOpened = !ctx.state.unitById.get(p.unitId)?.introduced;
        let value = 0;
        let skill: string | null = null;
        for (const s of p.skills) {
          const st = ctx.state.skills.get(skillKey(p.unitId, s));
          if (!st || st.coverage !== "not_started" || covered.has(st.key) || p.difficulty !== st.baseLevel) continue;
          value += neverOpened ? 2 : 1;
          skill ??= st.key;
        }
        if (!skill) continue;
        const score = value / minutes;
        const tie = hashString(`${ctx.seed}:new:${p.id}`);
        if (!best || score > best.score || (score === best.score && tie < best.tie)) best = { p, skill, score, tie };
      }
      if (!best) break;
      add(best.p, "new", { code: "new_unstudied_final", params: { skill: best.skill } });
    }
    return out;
  }

  const best = (unitId: string, level: Difficulty) => bestNewProblem(ctx, unitId, level, taken, covered, budget, pending);
  const anyLeft = (unitId: string, level: Difficulty) => bestNewProblem(ctx, unitId, level, taken, covered, Number.POSITIVE_INFINITY, pending) !== null;

  if (opts.beyondPlan) {
    // "Get ahead": more problems from the current unit onward, beyond its target.
    const start = Math.max(0, ctx.plan.units.findIndex((u) => u.unitId === ctx.plan.currentUnitId));
    for (const up of ctx.plan.units.slice(start)) {
      if (!up.newLevel || up.closed) continue;
      while (out.length < limit) {
        const pick = best(up.unitId, up.newLevel);
        if (!pick) break;
        add(pick.problem, "extra", { code: "extra_ahead", params: { unit: up.unitId } });
      }
      if (out.length > 0) break;
    }
    return out;
  }

  let previousDone: string | null = null;
  for (const up of ctx.plan.units) {
    if (out.length >= limit || budget <= 0) break;
    if (!up.newLevel) continue;
    if (up.complete) {
      previousDone = up.unitId;
      continue;
    }
    const startsUnit = up.done === 0 && up.warmupDone === 0;
    let first = true;
    let warmups = Math.max(0, up.warmupTarget - up.warmupDone);
    while (warmups > 0 && out.length < limit) {
      const pick = best(up.unitId, "F");
      if (!pick) {
        // Out of time: the warm-up comes first next session. Out of Foundation problems: skip it.
        if (anyLeft(up.unitId, "F")) return out;
        warmups = 0;
        break;
      }
      add(pick.problem, "new", { code: "new_warmup", params: { unit: up.unitId } });
      warmups--;
      first = false;
    }
    if (warmups > 0) return out;
    let remaining = Math.max(0, up.target - up.done);
    let exhausted = false;
    while (remaining > 0 && out.length < limit) {
      const pick = best(up.unitId, up.newLevel);
      if (!pick) {
        // Out of time: continue in this unit next session. Out of problems: move on to the next unit.
        if (anyLeft(up.unitId, up.newLevel)) return out;
        exhausted = true;
        break;
      }
      const reason: Reason =
        first && startsUnit && previousDone
          ? { code: "new_next_unit", params: { unit: up.unitId, prev: previousDone } }
          : { code: "new_core", params: pick.topSkill ? { unit: up.unitId, skill: pick.topSkill } : { unit: up.unitId } };
      add(pick.problem, "new", reason);
      remaining--;
      first = false;
    }
    if (remaining > 0 && !exhausted) return out;
    previousDone = up.unitId;
  }
  return out;
}

/** The last day before today with a rating. */
export function previousStudyDay(state: LearningState, today: string): string | null {
  let best: string | null = null;
  for (const a of state.rated) if (a.ratedDay && a.ratedDay < today && (!best || a.ratedDay > best)) best = a.ratedDay;
  return best;
}

/** Yesterday's Challenge (see the header), or null when there's nothing to follow up. */
export function pickDailyChallenge(ctx: BuildContext, taken: ReadonlySet<string>): PlannedItem | null {
  const prevDay = previousStudyDay(ctx.state, ctx.today);
  if (!prevDay) return null;
  const pending = pendingProblemIds(ctx);
  const byId = new Map(ctx.problems.map((p) => [p.id, p]));
  type Cand = { skill: SkillStatus; clean: boolean; at: number; from: string };
  const cands: Cand[] = [];
  for (const a of ctx.state.rated) {
    if (a.ratedDay !== prevDay || a.rating !== "got_it") continue;
    const p = byId.get(a.problemId);
    if (!p) continue;
    for (const s of p.skills) {
      const st = ctx.state.skills.get(skillKey(p.unitId, s));
      if (!st || st.demonstrated || st.needsReinforcement || p.difficulty !== st.baseLevel) continue;
      cands.push({ skill: st, clean: !a.solutionViewed, at: a.ratedAt!.getTime(), from: p.id });
    }
  }
  cands.sort((x, y) => Number(y.clean) - Number(x.clean) || y.at - x.at);
  const fresh = (st: SkillStatus, level: Difficulty, exclude: string | null) =>
    ctx.problems
      .filter(
        (p) =>
          p.active &&
          p.unitId === st.unitId &&
          p.difficulty === level &&
          p.skills.includes(st.id) &&
          p.id !== exclude &&
          !taken.has(p.id) &&
          !pending.has(p.id) &&
          ratedCount(ctx, p.id) === 0,
      )
      .sort((a, b) => hashString(`${ctx.seed}:ch:${a.id}`) - hashString(`${ctx.seed}:ch:${b.id}`))[0] ?? null;
  const item = (p: EngineProblem, reason: Reason): PlannedItem => ({ track: "challenge", problemId: p.id, reviewItemId: null, reason, minutes: ctx.personal(p.id), essential: true });

  const tried = new Set<string>();
  for (const c of cands) {
    if (tried.has(c.skill.key)) continue;
    tried.add(c.skill.key);
    const params = { skill: c.skill.key, day: prevDay };
    if (c.clean) {
      if (c.skill.followLevel === "Ch" && c.skill.baseLevel !== "Ch") {
        const ch = fresh(c.skill, "Ch", null);
        if (ch) return item(ch, { code: "challenge_next_day", params });
      }
      const again = c.skill.baseLevel ? fresh(c.skill, c.skill.baseLevel, c.from) : null;
      if (again) return item(again, { code: "second_core", params });
    } else {
      const again = c.skill.baseLevel ? fresh(c.skill, c.skill.baseLevel, c.from) : null;
      if (again) return item(again, { code: "core_again_after_solution", params });
    }
  }
  return null;
}

function reinforcementReason(r: EngineReview): Reason {
  const day = todayISO(r.createdAt);
  if (r.reason === "easier") return { code: "reinforce_easier" };
  if (r.reason === "similar") return { code: "reinforce_similar", params: { day } };
  if (r.reason === "lost") return { code: "reinforce_lost", params: { day } };
  return { code: "reinforce_shaky", params: { day } };
}

/** Reinforcement due today or earlier, in priority order: an easier follow-up first, then oldest. */
export function dueReinforcement(ctx: BuildContext): EngineReview[] {
  const active = new Set(ctx.problems.filter((p) => p.active).map((p) => p.id));
  return ctx.reviews
    .filter((r) => REINFORCING.has(r.reason) && r.dueDate <= ctx.today && active.has(r.problemId))
    .sort(
      (a, b) =>
        Number(b.reason === "easier") - Number(a.reason === "easier") ||
        a.dueDate.localeCompare(b.dueDate) ||
        a.createdAt.getTime() - b.createdAt.getTime(),
    );
}

export type BuiltSession = { items: PlannedItem[]; bonus: PlannedItem | null };

export function buildSession(ctx: BuildContext, opts: { sessionMinutes: number; firstOfDay: boolean; exclude?: ReadonlySet<string> }): BuiltSession {
  const { rules } = ctx;
  const budget = Math.max(1, opts.sessionMinutes);
  const limit = budget * (1 + rules.tolerance);
  const taken = new Set<string>(opts.exclude ?? []);
  let used = 0;
  const fits = (m: number) => m <= limit && used + m <= limit;

  // 1. Yesterday's Challenge.
  let challenge: PlannedItem | null = null;
  let bonus: PlannedItem | null = null;
  if (opts.firstOfDay) {
    const ch = pickDailyChallenge(ctx, taken);
    if (ch) {
      if (ctx.plan.pacing.challengeMode === "daily" && fits(ch.minutes)) {
        challenge = ch;
        taken.add(ch.problemId);
        used += ch.minutes;
      } else {
        const skill = ch.reason.params?.skill;
        bonus = { ...ch, essential: false, reason: { code: "bonus_challenge", params: skill ? { skill } : {} } };
      }
    }
  }

  // 2. Keep room for at least one new problem while there's new material, so review never blocks progress.
  //    In the final review days, never-studied skills come first instead (up to half the session).
  let newReserve = 0;
  const unstudiedFirst: PlannedItem[] = [];
  if (ctx.plan.pacing.finalReview) {
    unstudiedFirst.push(...pickNewLearning(ctx, Math.max(0, budget * 0.5 - used), taken));
    used += unstudiedFirst.reduce((m, i) => m + i.minutes, 0);
  } else if (ctx.plan.currentUnitId && budget >= 20) {
    const next = pickNewLearning(ctx, Number.POSITIVE_INFINITY, new Set(taken), { maxCount: 1 })[0];
    if (next) newReserve = Math.min(next.minutes, budget * 0.5);
  }

  // 3. Look-backs that are due. Short sessions get a short one (a Foundation problem if needed).
  const lookbackItems: PlannedItem[] = [];
  const wanted = ctx.lookbacks.due.slice(0, ctx.lookbacks.remainingToday);
  const lookbackMax = ctx.plan.pacing.finalReview ? limit : Math.max(budget * rules.lookback.share, ctx.levelMinutes.F);
  for (const u of wanted) {
    const pick = pickLookbackProblem({
      unitId: u.unitId,
      today: ctx.today,
      units: ctx.units,
      problems: ctx.problems,
      state: ctx.state,
      reviews: ctx.reviews,
      rules,
      seed: ctx.seed,
      currentUnitId: ctx.plan.currentUnitId,
      personal: ctx.personal,
      maxMinutes: Math.min(lookbackMax, Math.max(0, limit - used - newReserve - lookbackItems.reduce((m, i) => m + i.minutes, 0))),
      taken,
    });
    if (!pick) continue;
    const reason: Reason = pick.retentionDay && !u.bridge && !u.final ? { code: "lookback_retention", params: { day: pick.retentionDay, unit: u.unitId } } : u.reason;
    lookbackItems.push({ track: "lookback", problemId: pick.problemId, reviewItemId: null, reason, minutes: pick.minutes, essential: true });
    taken.add(pick.problemId);
  }
  const lookbackReserve = budget >= 20 && lookbackItems[0] ? lookbackItems[0].minutes : 0;

  // 4. Targeted reinforcement, capped (and never into the room kept for new work and the look-back).
  const reinforcement: PlannedItem[] = [];
  const due = dueReinforcement(ctx);
  const longOverdue = due.some((r) => daysBetween(r.dueDate, ctx.today) >= rules.overdueDays);
  const cap = Math.min(
    budget * (longOverdue ? rules.reinforcementCapOverdue : rules.reinforcementCap) + budget * rules.tolerance,
    Math.max(0, limit - used - newReserve - lookbackReserve),
  );
  let reinforcementUsed = 0;
  for (const r of due) {
    if (taken.has(r.problemId)) continue;
    const m = ctx.personal(r.problemId);
    if (!fits(m) || reinforcementUsed + m > cap) continue;
    reinforcement.push({ track: "reinforcement", problemId: r.problemId, reviewItemId: r.id, reason: reinforcementReason(r), minutes: m, essential: true });
    taken.add(r.problemId);
    used += m;
    reinforcementUsed += m;
  }

  // 5. New learning in the time that's left (in the final review days the rest goes to look-backs).
  const fresh = ctx.plan.pacing.finalReview ? [] : pickNewLearning(ctx, Math.max(0, limit - used - lookbackReserve), taken);
  used += fresh.reduce((m, i) => m + i.minutes, 0);

  // Place look-backs: the first after `every` new problems (or at the end), the rest at the end if they fit.
  const ordered: PlannedItem[] = [];
  if (challenge) ordered.push(challenge);
  ordered.push(...unstudiedFirst, ...reinforcement);
  const placed: PlannedItem[] = [];
  for (const lbItem of lookbackItems) {
    if (used + lbItem.minutes <= limit) {
      placed.push(lbItem);
      used += lbItem.minutes;
    } else {
      taken.delete(lbItem.problemId);
    }
  }
  const every = rules.lookback.every;
  if (placed.length > 0 && fresh.length >= every) {
    ordered.push(...fresh.slice(0, every), placed[0], ...fresh.slice(every), ...placed.slice(1));
  } else {
    ordered.push(...fresh, ...placed);
  }
  return { items: ordered, bonus };
}

/** Optional extras after the plan ("Keep going"): more new work, an extra Challenge, an early look-back. */
export function keepGoingOptions(ctx: BuildContext, alreadyTaken: ReadonlySet<string>): PlannedItem[] {
  const taken = new Set(alreadyTaken);
  const out: PlannedItem[] = [];
  out.push(...pickNewLearning(ctx, Number.POSITIVE_INFINITY, taken, { beyondPlan: true, maxCount: 2 }));

  // An extra Challenge on a skill with a clean base-level Got it from an earlier day.
  const pending = pendingProblemIds(ctx);
  const byId = new Map(ctx.problems.map((p) => [p.id, p]));
  const ready = new Set<string>();
  for (const a of ctx.state.rated) {
    if (a.rating !== "got_it" || a.solutionViewed || !a.ratedDay || a.ratedDay >= ctx.today) continue;
    const p = byId.get(a.problemId);
    if (!p) continue;
    for (const s of p.skills) {
      const st = ctx.state.skills.get(skillKey(p.unitId, s));
      if (st && !st.demonstrated && !st.needsReinforcement && st.followLevel === "Ch" && p.difficulty === st.baseLevel) ready.add(st.key);
    }
  }
  for (const key of ready) {
    const [unitId, id] = key.split(":");
    const ch = ctx.problems
      .filter((p) => p.active && p.unitId === unitId && p.difficulty === "Ch" && p.skills.includes(id) && !taken.has(p.id) && !pending.has(p.id) && ratedCount(ctx, p.id) === 0)
      .sort((a, b) => hashString(`${ctx.seed}:xch:${a.id}`) - hashString(`${ctx.seed}:xch:${b.id}`))[0];
    if (ch) {
      out.push({ track: "extra", problemId: ch.id, reviewItemId: null, reason: { code: "extra_challenge", params: { skill: key } }, minutes: ctx.personal(ch.id), essential: false });
      taken.add(ch.id);
      break;
    }
  }

  // A look-back pulled forward (the unit coming up soonest).
  const next = ctx.lookbacks.upcoming[0];
  if (next) {
    const pick = pickLookbackProblem({
      unitId: next.unitId,
      today: ctx.today,
      units: ctx.units,
      problems: ctx.problems,
      state: ctx.state,
      reviews: ctx.reviews,
      rules: ctx.rules,
      seed: ctx.seed,
      currentUnitId: ctx.plan.currentUnitId,
      personal: ctx.personal,
      maxMinutes: Number.POSITIVE_INFINITY,
      taken,
    });
    if (pick) out.push({ track: "lookback", problemId: pick.problemId, reviewItemId: null, reason: { code: "extra_lookback", params: { unit: next.unitId } }, minutes: pick.minutes, essential: false });
  }
  return out;
}

/**
 * After an insertion (an easier problem, a bridge look-back) the planned time can run over. Pending
 * new-learning items are dropped from the end until it fits again; they come back next session.
 * `plannedDone` is the planned minutes of the items already done (not their actual time, so a
 * student who takes longer than expected is never cut short for it).
 */
export function overflowToDrop(pending: ReadonlyArray<{ track: Track; minutes: number }>, plannedDone: number, limit: number): number[] {
  let total = plannedDone + pending.reduce((m, i) => m + i.minutes, 0);
  const drop: number[] = [];
  for (let i = pending.length - 1; i >= 0 && total > limit; i--) {
    if (pending[i].track !== "new") continue;
    drop.push(i);
    total -= pending[i].minutes;
  }
  return drop;
}

/** The adaptive planner (src/lib/engine.ts and its parts), against the real problem bank. */
import { describe, expect, it } from "vitest";
import { ALL_PROBLEMS, SECTIONS } from "../content/index";
import { type Availability, describeAvailability, plannedSlots, validateAvailability, weeklyMinutes } from "../src/lib/availability";
import { computeModel, type EngineInput, planSession } from "../src/lib/engine";
import { refinedMinutes, speedFactor } from "../src/lib/estimates";
import {
  computeLearningState,
  type EngineAttempt,
  type EngineProblem,
  type EngineReview,
  type EngineUnit,
  type RatingValue,
  supersededReviewIds,
} from "../src/lib/learning-state";
import { type ReasonCode, reasonText } from "../src/lib/reasons";
import { DEFAULT_RULES, resolveRules } from "../src/lib/rules";
import { overflowToDrop } from "../src/lib/session-builder";

const units: EngineUnit[] = SECTIONS.map((s) => ({ id: s.id, title: s.title, sort: s.sort, kind: s.kind, skills: s.concepts }));
const problems: EngineProblem[] = ALL_PROBLEMS.map((p) => ({ id: p.id, unitId: p.section, difficulty: p.difficulty, skills: p.concepts, active: true, estMinutes: null, sort: p.sort }));
const byId = new Map(problems.map((p) => [p.id, p]));
const find = (unit: string, level: EngineProblem["difficulty"], skill?: string) =>
  problems.filter((p) => p.unitId === unit && p.difficulty === level && (!skill || p.skills.includes(skill)));

const week = (sessions: number, minutes: number, days: string[]): Availability => ({ v: 1, days: Object.fromEntries(days.map((d) => [d, { sessions, minutes }])) });
const MON_FRI = ["mon", "tue", "wed", "thu", "fri"];
const A = week(1, 30, MON_FRI);
const B = week(2, 30, MON_FRI);
const C = week(1, 90, [...MON_FRI, "sat"]);

let n = 0;
function attempt(problemId: string, day: string, rating: RatingValue | null, opts: { origin?: EngineAttempt["origin"]; solution?: boolean; hour?: number } = {}): EngineAttempt {
  const at = new Date(Date.parse(`${day}T17:00:00Z`) + (opts.hour ?? 0) * 3_600_000 + n * 1000);
  n++;
  return {
    id: `t${n}`,
    problemId,
    origin: opts.origin ?? "plan",
    openedAt: at,
    ratedAt: rating ? new Date(at.getTime() + 600_000) : null,
    ratedDay: rating ? day : null,
    rating,
    solutionViewed: opts.solution ?? false,
    hintsShown: 0,
    answerRevealed: false,
    activeSeconds: 0,
    sessionItemId: null,
  };
}
const input = (over: Partial<EngineInput> = {}): EngineInput => ({
  today: "2026-11-09",
  examDate: "2026-12-02",
  availability: A,
  units,
  problems,
  attempts: [],
  reviews: [],
  timeStats: new Map(),
  rules: DEFAULT_RULES,
  seed: "student-1",
  includeSupplementary: false,
  ...over,
});
const sessionLength = (av: Availability) => Object.values(av.days)[0]!.minutes;

describe("availability", () => {
  it("validates a weekly pattern and totals it", () => {
    expect(validateAvailability({ days: {} }).ok).toBe(false);
    expect(validateAvailability({ days: { mon: { sessions: 4, minutes: 30 } } }).ok).toBe(false);
    expect(validateAvailability({ days: { mon: { sessions: 1, minutes: 10 } } }).ok).toBe(false);
    const r = validateAvailability({ days: { mon: { sessions: 2, minutes: 30 }, sat: { sessions: 1, minutes: 90 }, xyz: 1 } });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(weeklyMinutes(r.value)).toBe(150);
    expect(describeAvailability(r.value)).toBe("Mon 2 × 30 min · Sat 1 × 90 min");
    expect(describeAvailability(A)).toBe("Mon–Fri · 1 × 30 min");
    expect(describeAvailability({ v: 1, days: { ...A.days, sat: { sessions: 1, minutes: 60 } } })).toBe("Mon–Fri 1 × 30 min · Sat 1 × 60 min");
  });

  it("lists every planned session between two days", () => {
    const slots = plannedSlots(B, "2026-11-09", "2026-11-16");
    expect(slots).toHaveLength(10);
    expect(slots[0]).toEqual({ day: "2026-11-09", slot: 1, minutes: 30 });
  });
});

describe("rules and time estimates", () => {
  it("merges admin overrides and ignores bad values", () => {
    const r = resolveRules({ minutes: { C: 12, F: -3 }, lookback: { intervals: [1, 3], every: "x" }, nonsense: 1 });
    expect(r.minutes).toEqual({ F: 5, C: 12, Ch: 15 });
    expect(r.lookback.intervals).toEqual([1, 3]);
    expect(r.lookback.every).toBe(3);
  });

  it("learns a student's speed slowly, within limits", () => {
    const slow = (k: number) => Array.from({ length: k }, () => ({ seconds: 20 * 60, estimateMinutes: 10 }));
    const few = speedFactor(slow(2), DEFAULT_RULES).factor;
    const many = speedFactor(slow(20), DEFAULT_RULES).factor;
    expect(few).toBeGreaterThan(1);
    expect(few).toBeLessThan(many);
    expect(many).toBeLessThanOrEqual(2);
    expect(speedFactor([], DEFAULT_RULES)).toEqual({ factor: 1, n: 0 });
    expect(speedFactor([{ seconds: 5, estimateMinutes: 10 }], DEFAULT_RULES).n).toBe(0);
  });

  it("blends a problem's estimate toward the class's typical time after five students", () => {
    expect(refinedMinutes(10, { n: 4, sumLogSeconds: 4 * Math.log(1200) }, DEFAULT_RULES)).toBe(10);
    expect(refinedMinutes(10, { n: 5, sumLogSeconds: 5 * Math.log(1200) }, DEFAULT_RULES)).toBeCloseTo(15, 5);
  });
});

describe("learning state (the six states and mastery)", () => {
  const core = find("4.10", "C", "power-rule");
  const ch = find("4.10", "Ch", "power-rule");
  const state = (attempts: EngineAttempt[], reviews: EngineReview[] = []) => computeLearningState({ units, problems, attempts, reviews, rules: DEFAULT_RULES });
  const skill = (attempts: EngineAttempt[], key = "4.10:power-rule") => state(attempts).skills.get(key)!;

  it("never counts unseen problems, and tells opened from attempted from completed", () => {
    expect(skill([]).state).toBe("not_started");
    expect(skill([attempt(core[0].id, "2026-11-09", null)]).state).toBe("introduced");
    expect(skill([attempt(find("4.10", "F", "power-rule")[0].id, "2026-11-09", "got_it")]).state).toBe("attempted");
    expect(skill([attempt(core[0].id, "2026-11-09", "got_it")]).state).toBe("completed");
  });

  it("needs Got it on Core, then on a Challenge on a later day, without the worked solution", () => {
    const c = attempt(core[0].id, "2026-11-09", "got_it");
    expect(skill([c]).demonstrated).toBe(false);
    expect(skill([c, attempt(ch[0].id, "2026-11-09", "got_it", { hour: 1 })]).demonstrated).toBe(false);
    expect(skill([c, attempt(ch[0].id, "2026-11-10", "got_it", { solution: true })]).demonstrated).toBe(false);
    expect(skill([attempt(core[0].id, "2026-11-09", "got_it", { solution: true }), attempt(ch[0].id, "2026-11-10", "got_it")]).demonstrated).toBe(false);
    expect(skill([c, attempt(ch[0].id, "2026-11-10", "got_it")]).state).toBe("demonstrated");
  });

  it("loses Demonstrated after a later Shaky or Lost", () => {
    const shown = [attempt(core[0].id, "2026-11-09", "got_it"), attempt(ch[0].id, "2026-11-10", "got_it")];
    const s = skill([...shown, attempt(core[1].id, "2026-11-12", "shaky")]);
    expect(s.state).toBe("needs_reinforcement");
    expect(s.demonstrated).toBe(false);
  });

  it("closes reinforcement that's no longer needed once the skill is demonstrated", () => {
    // 4.10-487 is tagged only with trig antiderivatives; 4.10-501 (Core) and 4.10-489 (Challenge) share it.
    expect(byId.get("4.10-487")!.skills).toEqual(["trig-antiderivatives"]);
    const weak = attempt("4.10-487", "2026-11-09", "shaky");
    const review: EngineReview = { id: "r1", problemId: "4.10-487", sourceProblemId: null, dueDate: "2026-11-10", reason: "shaky", createdAt: weak.ratedAt! };
    expect(supersededReviewIds(state([weak], [review]), [review], problems)).toEqual([]);
    const after = state([weak, attempt("4.10-501", "2026-11-10", "got_it"), attempt("4.10-489", "2026-11-11", "got_it")], [review]);
    // The open item still shows as needing reinforcement, but the evidence is there, so it can close.
    expect(after.skills.get("4.10:trig-antiderivatives")!.state).toBe("needs_reinforcement");
    expect(supersededReviewIds(after, [review], problems)).toEqual(["r1"]);
  });

  it("uses a second Core problem on a later day when the skill has no Challenge problem", () => {
    const key = "4.10:rewrite-first";
    const rewrite = find("4.10", "C", "rewrite-first");
    expect(find("4.10", "Ch", "rewrite-first")).toHaveLength(0);
    expect(skill([attempt(rewrite[0].id, "2026-11-09", "got_it"), attempt(rewrite[0].id, "2026-11-11", "got_it")], key).demonstrated).toBe(false);
    expect(skill([attempt(rewrite[0].id, "2026-11-09", "got_it"), attempt(rewrite[1].id, "2026-11-11", "got_it")], key).demonstrated).toBe(true);
  });

  it("counts only new-learning work toward a unit, and a unit is demonstrated only when every skill is", () => {
    const st = state([attempt(core[0].id, "2026-11-09", "got_it"), attempt(core[1].id, "2026-11-09", "got_it", { origin: "review" })]);
    const u = st.unitById.get("4.10")!;
    expect(u.newByLevel.C).toBe(1);
    expect(u.ratedByLevel.C).toBe(2);
    expect(u.demonstrated).toBe(false);
  });
});

describe("planner (how much each student gets)", () => {
  const plan = (av: Availability, over: Partial<EngineInput> = {}) => computeModel(input({ availability: av, ...over })).plan;
  const total = (p: ReturnType<typeof plan>) => p.units.reduce((m, u) => m + u.target, 0);

  it("gives students with more time more problems (A < B < C) and different pacing", () => {
    const [a, b, c] = [plan(A), plan(B), plan(C)];
    expect(total(a)).toBeLessThan(total(b));
    expect(total(b)).toBeLessThan(total(c));
    expect(a.pacing).toMatchObject({ status: "tight", challengeMode: "bonus" });
    expect(b.pacing).toMatchObject({ status: "on_track", challengeMode: "daily" });
    expect(c.pacing.status).toBe("ahead");
    for (const p of [a, b, c]) {
      for (const u of p.units) {
        expect(u.target).toBeGreaterThanOrEqual(2);
        expect(u.target).toBeLessThanOrEqual(u.pool);
      }
    }
    expect(a.units[0]).toMatchObject({ unitId: "4.10", warmupTarget: 2 });
    expect(a.units.slice(1).every((u) => u.warmupTarget === 0)).toBe(true);
  });

  it("keeps the last two study days for review, and says plainly when time runs short", () => {
    const late = plan(A, { today: "2026-11-26" });
    expect(late.pacing.reviewDays).toEqual(["2026-11-30", "2026-12-01"]);
    expect(late.pacing.status).toBe("behind");
    expect(late.pacing.extraWeeklyMinutes).toBeGreaterThan(0);
    expect(plan(A, { today: "2026-11-30" }).pacing.finalReview).toBe(true);
    const passed = plan(A, { today: "2026-12-03" });
    expect(passed.pacing.examPassed).toBe(true);
    expect(passed.pacing.status).not.toBe("behind");
  });

  it("copes with units that have no problems or only one level", () => {
    const extraUnits: EngineUnit[] = [
      ...units,
      { id: "9.1", title: "Empty", sort: 20, kind: "core", skills: [{ id: "x", label: "X" }] },
      { id: "9.2", title: "Challenge only", sort: 21, kind: "core", skills: [{ id: "y", label: "Y" }] },
    ];
    const extraProblems: EngineProblem[] = [...problems, { id: "9.2-1", unitId: "9.2", difficulty: "Ch", skills: ["y"], active: true, estMinutes: null, sort: 1 }];
    const p = computeModel(input({ units: extraUnits, problems: extraProblems, availability: C })).plan;
    expect(p.units.find((u) => u.unitId === "9.1")).toMatchObject({ newLevel: null, complete: true, target: 0 });
    expect(p.units.find((u) => u.unitId === "9.2")).toMatchObject({ newLevel: "Ch", target: 1 });
  });
});

describe("sessions (what goes into today)", () => {
  const build = (av: Availability, over: Partial<EngineInput> = {}, firstOfDay = true) => {
    const m = computeModel(input({ availability: av, ...over }));
    return { m, s: planSession(m, { sessionMinutes: sessionLength(av), firstOfDay }) };
  };
  const minutesOf = (items: Array<{ minutes: number }>) => items.reduce((m, i) => m + i.minutes, 0);

  it("fits the session length, and 4.10 opens with Foundation warm-ups", () => {
    for (const av of [A, B, C]) {
      const { s } = build(av);
      const limit = sessionLength(av) * 1.1;
      expect(minutesOf(s.items)).toBeLessThanOrEqual(limit);
      expect(s.items.every((i) => i.minutes <= limit)).toBe(true);
      expect(s.items[0]).toMatchObject({ track: "new", reason: { code: "new_warmup" } });
      expect(byId.get(s.items[0].problemId)!.difficulty).toBe("F");
      expect(s.items.every((i) => i.reason.code.length > 0)).toBe(true);
    }
  });

  it("picks representative problems, not the whole pool", () => {
    const { m } = build(B);
    expect(m.plan.units.reduce((s, u) => s + u.target, 0)).toBeLessThan(find("4.10", "C").length * 8);
    expect(m.plan.units.every((u) => u.target < u.pool || u.pool <= 2)).toBe(true);
  });

  const warmups = find("4.10", "F").slice(0, 2).map((p) => attempt(p.id, "2026-11-09", "got_it"));
  const core = find("4.10", "C", "power-rule")[0];
  const sharesSkill = (a: string, b: string) => byId.get(a)!.skills.some((s) => byId.get(b)!.skills.includes(s));

  it("opens the next day with a Challenge on yesterday's clean Got it", () => {
    const { s } = build(B, { today: "2026-11-10", attempts: [...warmups, attempt(core.id, "2026-11-09", "got_it")] });
    expect(s.items[0]).toMatchObject({ track: "challenge", reason: { code: "challenge_next_day" } });
    expect(byId.get(s.items[0].problemId)!.difficulty).toBe("Ch");
    expect(sharesSkill(s.items[0].problemId, core.id)).toBe(true);
  });

  it("gives another Core problem instead when yesterday's Got it needed the worked solution, and nothing after Shaky", () => {
    const solution = build(B, { today: "2026-11-10", attempts: [...warmups, attempt(core.id, "2026-11-09", "got_it", { solution: true })] }).s;
    expect(solution.items[0]).toMatchObject({ track: "challenge", reason: { code: "core_again_after_solution" } });
    expect(byId.get(solution.items[0].problemId)!.difficulty).toBe("C");
    const shaky = build(B, { today: "2026-11-10", attempts: [...warmups, attempt(core.id, "2026-11-09", "shaky")] }).s;
    expect(shaky.items.some((i) => i.track === "challenge")).toBe(false);
  });

  it("makes the Challenge an optional bonus when the student is behind", () => {
    const { s } = build(A, { today: "2026-11-10", attempts: [...warmups, attempt(core.id, "2026-11-09", "got_it")] });
    expect(s.items.some((i) => i.track === "challenge")).toBe(false);
    expect(s.bonus).toMatchObject({ essential: false, reason: { code: "bonus_challenge" } });
  });

  it("keeps room for new work even with a pile of overdue reinforcement", () => {
    const pile: EngineReview[] = find("4.10", "C").slice(1, 9).map((p, i) => ({
      id: `r${i}`,
      problemId: p.id,
      sourceProblemId: null,
      dueDate: "2026-11-04",
      reason: "shaky",
      createdAt: new Date("2026-11-03T20:00:00Z"),
    }));
    const { s } = build(B, { today: "2026-11-10", attempts: warmups, reviews: pile });
    expect(s.items.some((i) => i.track === "new")).toBe(true);
    expect(minutesOf(s.items.filter((i) => i.track === "reinforcement"))).toBeLessThanOrEqual(30 * 0.7);
    expect(minutesOf(s.items)).toBeLessThanOrEqual(33);
  });

  it("never doubles the session after missed days", () => {
    const { s } = build(A, { today: "2026-11-13", attempts: warmups });
    expect(minutesOf(s.items)).toBeLessThanOrEqual(33);
  });

  it("puts never-studied skills first in the final review days", () => {
    const { s } = build(A, { today: "2026-11-30", attempts: [...warmups, attempt(core.id, "2026-11-09", "got_it")] });
    const first = s.items.find((i) => i.track !== "challenge")!;
    expect(first.reason.code).toBe("new_unstudied_final");
  });

  it("drops pending new problems (only) when an insertion runs over time", () => {
    const pending = [
      { track: "reinforcement" as const, minutes: 6 },
      { track: "new" as const, minutes: 10 },
      { track: "lookback" as const, minutes: 6 },
      { track: "new" as const, minutes: 10 },
    ];
    expect(overflowToDrop(pending, 10, 33)).toEqual([3]);
    expect(overflowToDrop(pending, 0, 40)).toEqual([]);
  });
});

describe("look-backs (Regressive Study)", () => {
  const f410 = find("4.10", "F").slice(0, 2).map((p) => attempt(p.id, "2026-11-09", "got_it"));
  const c410 = find("4.10", "C").map((p) => attempt(p.id, "2026-11-10", "got_it"));
  const c51 = find("5.1", "C");
  const finished410 = [...f410, ...c410];
  const lookbacks = (attempts: EngineAttempt[], today = "2026-11-11") => computeModel(input({ availability: C, today, attempts })).lookbacks;

  it("asks for one problem from the previous unit after the first two problems in a new one", () => {
    const one = lookbacks([...finished410, attempt(c51[0].id, "2026-11-11", "got_it")]);
    expect(one.due).toHaveLength(0);
    const two = lookbacks([...finished410, attempt(c51[0].id, "2026-11-11", "got_it"), attempt(c51[1].id, "2026-11-11", "got_it", { hour: 1 })]);
    expect(two.due[0]).toMatchObject({ unitId: "4.10", bridge: true, reason: { code: "lookback_bridge" } });
  });

  it("never reviews a unit the student hasn't studied", () => {
    const lb = lookbacks([...finished410, attempt(c51[0].id, "2026-11-11", "got_it")]);
    expect(lb.units.map((u) => u.unitId)).toEqual(["4.10"]);
  });

  it("brings a weak unit back sooner", () => {
    const lost = attempt(find("4.10", "Ch")[0].id, "2026-11-10", "lost");
    const lb = lookbacks([...finished410, lost, attempt(c51[0].id, "2026-11-11", "got_it")]);
    expect(lb.due[0]).toMatchObject({ unitId: "4.10", weak: true });
  });

  it("waits longer after each successful look-back", () => {
    const history = [
      ...finished410,
      attempt(c51[0].id, "2026-11-11", "got_it"),
      attempt(c51[1].id, "2026-11-11", "got_it", { hour: 1 }),
      attempt(find("4.10", "F")[3].id, "2026-11-12", "got_it", { origin: "lookback" }),
    ];
    const unit = lookbacks(history, "2026-11-13").units.find((u) => u.unitId === "4.10")!;
    expect(unit).toMatchObject({ box: 1, dueDay: "2026-11-16", due: false });
  });
});

describe("reasons", () => {
  it("explains every reason in plain words", () => {
    const codes: ReasonCode[] = [
      "new_warmup", "new_core", "new_next_unit", "new_unstudied_final", "challenge_next_day", "second_core", "core_again_after_solution",
      "reinforce_shaky", "reinforce_lost", "reinforce_similar", "reinforce_easier", "lookback_bridge", "lookback_due", "lookback_weak",
      "lookback_building_block", "lookback_retention", "lookback_final", "extra_ahead", "extra_challenge", "extra_lookback", "bonus_challenge",
    ];
    const lookup = {
      unitTitle: (id: string) => SECTIONS.find((s) => s.id === id)?.title,
      skillLabel: (key: string) => SECTIONS.find((s) => s.id === key.split(":")[0])?.concepts.find((c) => c.id === key.split(":")[1])?.label,
    };
    const params = { unit: "5.1", current: "5.2", prev: "4.10", skill: "5.1:sigma-notation", day: "2026-11-09", days: 3, rating: "shaky" };
    for (const code of codes) {
      const text = reasonText({ code, params }, lookup);
      expect(text.length, code).toBeGreaterThan(10);
      expect(text, code).not.toMatch(/undefined|NaN|\[object/);
    }
  });
});

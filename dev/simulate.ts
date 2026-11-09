/**
 * Replays three made-up students day by day through the real planner (src/lib/engine.ts), with
 * pretend ratings, so the plans can be checked before (and after) any UI change.
 *
 *   npx tsx dev/simulate.ts            # all three, every session
 *   npx tsx dev/simulate.ts --summary  # only the per-student summaries
 *
 * A: 30 min x 1 session x Mon-Fri       slower, more Shaky/Lost
 * B: 30 min x 2 sessions x Mon-Fri      average
 * C: 90 min x 1 session x Mon-Sat       quicker, mostly Got it
 */
import { ALL_PROBLEMS, SECTIONS, type Difficulty } from "../content/index";
import { type Availability, dayPlan } from "../src/lib/availability";
import { addDays, formatShortWeekday } from "../src/lib/dates";
import { computeModel, planSession, type StudentModel } from "../src/lib/engine";
import { type EngineAttempt, type EngineProblem, type EngineReview, type EngineUnit, type Origin, type SkillState, supersededReviewIds } from "../src/lib/learning-state";
import { hashString, mulberry32 } from "../src/lib/random";
import { reasonText, type Track } from "../src/lib/reasons";
import { pickLookbackProblem } from "../src/lib/regressive";
import { DEFAULT_RULES } from "../src/lib/rules";
import { followUpsToClose, scheduleAfterRating } from "../src/lib/scheduler";
import { overflowToDrop, type PlannedItem } from "../src/lib/session-builder";

const START = "2026-11-09";
const EXAM = "2026-12-02";
const rules = DEFAULT_RULES;
const summaryOnly = process.argv.includes("--summary");

const units: EngineUnit[] = SECTIONS.map((s) => ({ id: s.id, title: s.title, sort: s.sort, kind: s.kind, skills: s.concepts }));
const problems: EngineProblem[] = ALL_PROBLEMS.map((p) => ({
  id: p.id,
  unitId: p.section,
  difficulty: p.difficulty,
  skills: p.concepts,
  active: true,
  estMinutes: null,
  sort: p.sort,
}));
const byId = new Map(problems.map((p) => [p.id, p]));
const lookup = {
  unitTitle: (id: string) => SECTIONS.find((s) => s.id === id)?.title,
  skillLabel: (key: string) => {
    const [u, s] = key.split(":");
    return SECTIONS.find((x) => x.id === u)?.concepts.find((c) => c.id === s)?.label;
  },
};

type Profile = {
  name: string;
  availability: Availability;
  /** Actual time / planned time. */
  speed: number;
  /** Chance of Got it and of Lost by difficulty (Shaky is the rest). */
  got: Record<Difficulty, number>;
  lost: Record<Difficulty, number>;
  /** Chance of opening the worked solution: after a Got it, and otherwise. */
  solutionOnGot: number;
  solutionOtherwise: number;
};

const weekdays = (sessions: number, minutes: number, days: string[]): Availability => ({
  v: 1,
  days: Object.fromEntries(days.map((d) => [d, { sessions, minutes }])),
});

const PROFILES: Profile[] = [
  {
    name: "A",
    availability: weekdays(1, 30, ["mon", "tue", "wed", "thu", "fri"]),
    speed: 1.2,
    got: { F: 0.7, C: 0.55, Ch: 0.35 },
    lost: { F: 0.08, C: 0.15, Ch: 0.3 },
    solutionOnGot: 0.2,
    solutionOtherwise: 0.6,
  },
  {
    name: "B",
    availability: weekdays(2, 30, ["mon", "tue", "wed", "thu", "fri"]),
    speed: 1.0,
    got: { F: 0.8, C: 0.68, Ch: 0.45 },
    lost: { F: 0.05, C: 0.1, Ch: 0.2 },
    solutionOnGot: 0.12,
    solutionOtherwise: 0.5,
  },
  {
    name: "C",
    availability: weekdays(1, 90, ["mon", "tue", "wed", "thu", "fri", "sat"]),
    speed: 0.8,
    got: { F: 0.9, C: 0.8, Ch: 0.6 },
    lost: { F: 0.02, C: 0.05, Ch: 0.12 },
    solutionOnGot: 0.08,
    solutionOtherwise: 0.4,
  },
];

const ORIGIN: Record<Track, Origin> = { new: "plan", challenge: "challenge", reinforcement: "review", lookback: "lookback", extra: "extra" };
const SHORT: Record<string, string> = { got_it: "Got it", shaky: "Shaky", lost: "Lost" };

function simulate(profile: Profile) {
  const rand = mulberry32(hashString(`sim:${profile.name}`));
  const attempts: EngineAttempt[] = [];
  let reviews: EngineReview[] = [];
  let n = 0;
  const tally = { sessions: 0, minutes: 0, byTrack: { new: 0, challenge: 0, reinforcement: 0, lookback: 0, extra: 0 } as Record<Track, number>, got_it: 0, shaky: 0, lost: 0 };
  const lookbacksByUnit = new Map<string, number>();
  let firstModel: StudentModel | null = null;
  let lastModel: StudentModel | null = null;
  const out: string[] = [];

  const model = (today: string, minutesUsedToday: number, challengeDoneToday: boolean) =>
    computeModel({
      today,
      examDate: EXAM,
      availability: profile.availability,
      units,
      problems,
      attempts,
      reviews,
      timeStats: new Map(),
      rules,
      seed: `student-${profile.name}`,
      includeSupplementary: false,
      minutesUsedToday,
      challengeDoneToday,
    });

  for (let day = START; day < EXAM; day = addDays(day, 1)) {
    const plan = dayPlan(profile.availability, day);
    if (!plan) continue;
    let usedToday = 0;
    for (let slot = 1; slot <= plan.sessions; slot++) {
      const m = model(day, usedToday, slot > 1);
      firstModel ??= m;
      const built = planSession(m, { sessionMinutes: plan.minutes, firstOfDay: slot === 1 });
      const queue: PlannedItem[] = [...built.items];
      const cur = m.plan.units.find((u) => u.unitId === m.plan.currentUnitId);
      tally.sessions++;
      if (!summaryOnly) {
        const planned = queue.reduce((s, i) => s + i.minutes, 0);
        out.push(
          `${formatShortWeekday(day)} S${slot} ${plan.minutes}m | ${m.plan.pacing.status}, challenge ${m.plan.pacing.challengeMode}${m.plan.pacing.finalReview ? ", FINAL REVIEW" : ""} | unit ${cur ? `${cur.unitId} ${cur.done}/${cur.target}` : "all planned work done"} | planned ${planned}m${built.bonus ? " | bonus offered" : ""}`,
        );
      }
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        const p = byId.get(item.problemId)!;
        const r = rand();
        const rating = r < profile.got[p.difficulty] ? "got_it" : r < profile.got[p.difficulty] + profile.lost[p.difficulty] ? "lost" : "shaky";
        const solutionViewed = rand() < (rating === "got_it" ? profile.solutionOnGot : profile.solutionOtherwise);
        // True time comes from the problem's difficulty and the student's real speed (not the planner's guess).
        const minutes = Math.max(1, rules.minutes[p.difficulty] * profile.speed * (0.75 + 0.5 * rand()));
        const at = new Date(new Date(`${day}T23:00:00Z`).getTime() + (slot - 1) * 3 * 3_600_000 + usedToday * 60_000);
        const attempt: EngineAttempt = {
          id: `a${++n}`,
          problemId: p.id,
          origin: ORIGIN[item.track],
          openedAt: at,
          ratedAt: new Date(at.getTime() + minutes * 60_000),
          ratedDay: day,
          rating,
          solutionViewed,
          hintsShown: 0,
          answerRevealed: true,
          activeSeconds: Math.round(minutes * 60),
          sessionItemId: null,
        };
        const attemptedBefore = new Set(attempts.filter((a) => a.ratedAt).map((a) => a.problemId));
        attempts.push(attempt);
        usedToday += minutes;
        tally.minutes += minutes;
        tally.byTrack[item.track]++;
        tally[rating]++;
        if (item.track === "lookback") lookbacksByUnit.set(p.unitId, (lookbacksByUnit.get(p.unitId) ?? 0) + 1);
        // This rating answers any pending review of the same problem; a clean Got it also closes its follow-ups.
        reviews = reviews.filter((x) => x.problemId !== p.id);
        if (rating === "got_it" && !solutionViewed) {
          const close = new Set(followUpsToClose(reviews, p.id));
          reviews = reviews.filter((x) => !close.has(x.id));
        }
        let inserted = "";
        if (rating !== "got_it") {
          const res = scheduleAfterRating({
            rating,
            problem: { id: p.id, difficulty: p.difficulty, concepts: p.skills, sort: p.sort },
            pool: problems.filter((x) => x.unitId === p.unitId).map((x) => ({ id: x.id, difficulty: x.difficulty, concepts: x.skills, sort: x.sort })),
            today: day,
            attempted: attemptedBefore,
            pending: new Set(reviews.map((x) => x.problemId)),
            assigned: new Set(),
            seed: `student-${profile.name}`,
            immediateEasier: item.reason.code !== "reinforce_easier",
          });
          for (const it of res.items) {
            if (reviews.some((x) => x.problemId === it.problemId)) continue;
            const review: EngineReview = { id: `r${++n}`, problemId: it.problemId, sourceProblemId: it.sourceProblemId, dueDate: it.dueDate, reason: it.reason, createdAt: attempt.ratedAt! };
            reviews.push(review);
            if (it.problemId === res.nextProblemId) {
              queue.splice(i + 1, 0, { track: "reinforcement", problemId: it.problemId, reviewItemId: review.id, reason: { code: "reinforce_easier" }, minutes: m.personal(it.problemId), essential: true });
              inserted = ` -> easier ${it.problemId} inserted`;
            }
          }
        }
        // A bridge look-back can become due mid-session (after the first problems in a new unit).
        let after = model(day, usedToday, true);
        const superseded = new Set(supersededReviewIds(after.state, reviews, problems));
        if (superseded.size > 0) {
          reviews = reviews.filter((x) => !superseded.has(x.id));
          after = model(day, usedToday, true);
        }
        lastModel = after;
        const bridge = after.lookbacks.due.find((u) => u.bridge);
        if (bridge && after.lookbacks.remainingToday > 0 && !queue.slice(i + 1).some((q) => q.track === "lookback")) {
          const pick = pickLookbackProblem({
            unitId: bridge.unitId,
            today: day,
            units,
            problems,
            state: after.state,
            reviews,
            rules,
            seed: `student-${profile.name}`,
            currentUnitId: after.plan.currentUnitId,
            personal: after.personal,
            maxMinutes: Number.POSITIVE_INFINITY,
            taken: new Set(queue.map((q) => q.problemId)),
          });
          if (pick) {
            queue.splice(i + 1 + (inserted ? 1 : 0), 0, { track: "lookback", problemId: pick.problemId, reviewItemId: null, reason: bridge.reason, minutes: pick.minutes, essential: true });
            inserted += ` -> look-back ${pick.problemId} inserted`;
          }
        }
        if (inserted) {
          // Insertions can push the plan over time: drop pending new problems from the end.
          const plannedDone = queue.slice(0, i + 1).reduce((s, q) => s + q.minutes, 0);
          const drop = overflowToDrop(queue.slice(i + 1), plannedDone, plan.minutes * (1 + rules.tolerance));
          for (const d of drop.sort((x, y) => y - x)) {
            inserted += ` (moved ${queue[i + 1 + d].problemId} to next time)`;
            queue.splice(i + 1 + d, 1);
          }
        }
        if (!summaryOnly) {
          out.push(
            `   ${String(i + 1).padStart(2)}. ${item.track.padEnd(13)} ${p.difficulty.padEnd(2)} ${p.id.padEnd(9)} ${String(item.minutes).padStart(2)}m  ${SHORT[rating].padEnd(6)}${solutionViewed ? " (solution)" : ""}  ${reasonText(item.reason, lookup)}${inserted}`,
          );
        }
      }
    }
  }

  const end = lastModel!;
  const counts: Record<SkillState, number> = { not_started: 0, introduced: 0, attempted: 0, completed: 0, needs_reinforcement: 0, demonstrated: 0 };
  for (const s of end.state.skills.values()) if (s.unitId !== "4.1" && s.unitId !== "4.2") counts[s.state]++;
  out.push("");
  out.push(`=== Student ${profile.name}: ${JSON.stringify(profile.availability.days.mon ?? profile.availability.days.tue)} on ${Object.keys(profile.availability.days).join(",")} ===`);
  out.push(
    `Start (Nov 9): ${firstModel!.plan.pacing.status}, daily Challenge ${firstModel!.plan.pacing.challengeMode}; capacity ${firstModel!.plan.pacing.capacity} new problems, minimum needs ${firstModel!.plan.pacing.needed}; Core per unit: ${firstModel!.plan.units.map((u) => `${u.unitId}=${u.target}`).join(" ")}`,
  );
  out.push(`End (Dec 1): units ${end.plan.units.map((u) => `${u.unitId} ${u.done}/${u.target}${u.warmupTarget ? ` (+${u.warmupDone} warm-up)` : ""}`).join(" · ")}`);
  out.push(`Sessions ${tally.sessions}, minutes ${Math.round(tally.minutes)} | new ${tally.byTrack.new}, challenge ${tally.byTrack.challenge}, reinforcement ${tally.byTrack.reinforcement}, look-backs ${tally.byTrack.lookback}`);
  out.push(`Ratings: Got it ${tally.got_it}, Shaky ${tally.shaky}, Lost ${tally.lost} | speed factor learned ${end.speed.factor.toFixed(2)} (true ${profile.speed})`);
  out.push(`Look-backs by unit: ${[...lookbacksByUnit.entries()].map(([u, c]) => `${u}=${c}`).join(" ") || "none"}`);
  out.push(
    `Skills (50): demonstrated ${counts.demonstrated}, completed ${counts.completed}, needs reinforcement ${counts.needs_reinforcement}, attempted ${counts.attempted}, introduced ${counts.introduced}, not started ${counts.not_started}`,
  );
  out.push(`Pending reinforcement at the end: ${reviews.length}`);
  return out.join("\n");
}

for (const p of PROFILES) {
  console.log(simulate(p));
  console.log("\n");
}

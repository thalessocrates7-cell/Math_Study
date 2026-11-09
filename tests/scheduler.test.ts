import { describe, expect, it } from "vitest";
import { followUpsToClose, pickEasier, pickSimilar, scheduleAfterRating, type PoolProblem, type ScheduleInput } from "../src/lib/scheduler";

const P = (id: string, difficulty: PoolProblem["difficulty"], concepts: string[], sort = 0): PoolProblem => ({ id, difficulty, concepts, sort });

const pool: PoolProblem[] = [
  P("f1", "F", ["power"], 1),
  P("f2", "F", ["power", "rewrite"], 2),
  P("f3", "F", ["trig"], 3),
  P("c1", "C", ["power"], 4),
  P("c2", "C", ["power", "rewrite"], 5),
  P("c3", "C", ["trig"], 6),
  P("h1", "Ch", ["power", "ivp"], 7),
  P("h2", "Ch", ["trig"], 8),
];

function input(over: Partial<ScheduleInput> & Pick<ScheduleInput, "rating" | "problem">): ScheduleInput {
  return {
    pool,
    today: "2026-11-05",
    attempted: new Set(),
    pending: new Set(),
    assigned: new Set(),
    seed: "student-1",
    ...over,
  };
}

describe("scheduleAfterRating", () => {
  it("Got It: schedules nothing (look-backs and the next day's Challenge check retention)", () => {
    const r = scheduleAfterRating(input({ rating: "got_it", problem: pool[3] }));
    expect(r.items).toEqual([]);
    expect(r.nextProblemId).toBeNull();
  });

  it("Shaky: original tomorrow plus a similar problem (same difficulty, shared concept) tomorrow", () => {
    const r = scheduleAfterRating(input({ rating: "shaky", problem: pool[3] }));
    expect(r.items[0]).toEqual({ problemId: "c1", sourceProblemId: null, dueDate: "2026-11-06", reason: "shaky" });
    expect(r.items[1]).toMatchObject({ problemId: "c2", sourceProblemId: "c1", dueDate: "2026-11-06", reason: "similar" });
    expect(r.nextProblemId).toBeNull();
  });

  it("Lost: an easier Foundation problem on the same concept right away, original tomorrow", () => {
    const r = scheduleAfterRating(input({ rating: "lost", problem: pool[6] }));
    expect(r.items[0]).toEqual({ problemId: "h1", sourceProblemId: null, dueDate: "2026-11-06", reason: "lost" });
    expect(r.items[1].reason).toBe("easier");
    expect(r.items[1].dueDate).toBe("2026-11-05");
    expect(["f1", "f2"]).toContain(r.items[1].problemId);
    expect(r.nextProblemId).toBe(r.items[1].problemId);
  });

  it("crosses month boundaries correctly", () => {
    const r = scheduleAfterRating(input({ rating: "shaky", problem: pool[0], today: "2026-11-30" }));
    expect(r.items[0].dueDate).toBe("2026-12-01");
  });

  it("Lost on an easier follow-up: the next easier problem waits until tomorrow (no chains)", () => {
    const r = scheduleAfterRating(input({ rating: "lost", problem: pool[0], immediateEasier: false }));
    expect(r.nextProblemId).toBeNull();
    const easier = r.items.find((i) => i.reason === "easier");
    expect(easier?.dueDate).toBe("2026-11-06");
  });
});

describe("followUpsToClose", () => {
  const pending = [
    { id: "r1", problemId: "c1", sourceProblemId: null, reason: "shaky" },
    { id: "r2", problemId: "c2", sourceProblemId: "c1", reason: "similar" },
    { id: "r3", problemId: "f1", sourceProblemId: "h1", reason: "easier" },
    { id: "r4", problemId: "h1", sourceProblemId: null, reason: "lost" },
  ];
  it("closes the follow-ups made from a problem once that problem is solved cleanly", () => {
    expect(followUpsToClose(pending, "c1")).toEqual(["r2"]);
    expect(followUpsToClose(pending, "h1")).toEqual(["r3"]);
  });
  it("never closes the original's re-check when only a follow-up was solved", () => {
    expect(followUpsToClose(pending, "c2")).toEqual([]);
    expect(followUpsToClose(pending, "f1")).toEqual([]);
  });
});

describe("pickSimilar", () => {
  it("prefers problems outside the student's plan, then unattempted ones", () => {
    const r = pickSimilar(input({ rating: "shaky", problem: pool[3], assigned: new Set(["c2"]) }));
    // c2 is the only same-difficulty problem sharing "power"; with it assigned the next tier still picks it.
    expect(r?.id).toBe("c2");
  });

  it("skips attempted and already-queued problems", () => {
    expect(pickSimilar(input({ rating: "shaky", problem: pool[3], attempted: new Set(["c2"]) }))?.id).toBe("c3");
    expect(pickSimilar(input({ rating: "shaky", problem: pool[3], pending: new Set(["c2", "c3"]) }))?.id).toBe("f1");
  });

  it("returns null when nothing new is left", () => {
    const all = new Set(pool.map((p) => p.id));
    expect(pickSimilar(input({ rating: "shaky", problem: pool[3], attempted: all }))).toBeNull();
  });
});

describe("pickEasier", () => {
  it("for a Foundation problem, picks another Foundation problem on the same concept", () => {
    expect(pickEasier(input({ rating: "lost", problem: pool[0] }))?.id).toBe("f2");
  });

  it("falls back to a previously seen Foundation problem when nothing new is left", () => {
    const seen = new Set(pool.map((p) => p.id));
    const r = pickEasier(input({ rating: "lost", problem: pool[3], attempted: seen }));
    expect(r?.difficulty).toBe("F");
    expect(r?.concepts).toContain("power");
  });

  it("is deterministic for the same student", () => {
    const a = pickEasier(input({ rating: "lost", problem: pool[7] }));
    const b = pickEasier(input({ rating: "lost", problem: pool[7] }));
    expect(a?.id).toBe(b?.id);
    expect(a?.id).toBe("f3");
  });
});

/**
 * The study-session flow against a real (in-memory) Postgres with the real migrations and content:
 * schedule, start, the quiet timer, an easier problem after a Lost, pause, the next day's Challenge,
 * a bridge look-back, skip, finish and Keep going.
 */
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { createPgliteDb, type DB } from "../src/db/client";
import { attempts, problems, problemTimeStats, reviewItems, sessionItems, students, studySessions, type Student } from "../src/db/schema";
import type { Availability } from "../src/lib/availability";
import { loadStudentModel } from "../src/server/model";
import { addAttemptTime, openAttempt, rateAttempt } from "../src/server/practice";
import {
  addKeepGoing,
  finishSession,
  keepGoingFor,
  nextEssential,
  openSessionOf,
  previewNextSession,
  sessionItemsOf,
  setSessionPaused,
  skipItem,
  startSession,
} from "../src/server/sessions";
import { findOrCreateStudent, saveSchedule } from "../src/server/students";

let db: DB;
let student: Student;
const MON = new Date("2026-11-09T18:00:00Z"); // 1 pm in New York
const TUE = new Date("2026-11-10T18:00:00Z");
// 90 minutes, Monday to Saturday: comfortably on track, so the daily Challenge is part of the plan.
const AVAILABILITY: Availability = {
  v: 1,
  days: Object.fromEntries(["mon", "tue", "wed", "thu", "fri", "sat"].map((d) => [d, { sessions: 1, minutes: 90 }])),
};

const itemsOf = (sessionId: string) => sessionItemsOf(db, sessionId);
const problemOf = async (id: string) => (await db.select().from(problems).where(eq(problems.id, id)))[0];
const sessionRow = async (id: string) => (await db.select().from(studySessions).where(eq(studySessions.id, id)))[0];
const plannedMinutes = (list: Awaited<ReturnType<typeof itemsOf>>) =>
  list.filter((i) => i.essential && i.status !== "dropped").reduce((m, i) => m + i.minutes, 0);

async function solve(itemId: string, rating: "got_it" | "shaky" | "lost", now: Date) {
  const [item] = await db.select().from(sessionItems).where(eq(sessionItems.id, itemId));
  const att = await openAttempt(db, student.id, item.problemId, { origin: "plan", sessionItemId: item.id });
  await addAttemptTime(db, student.id, att.id, 150);
  return rateAttempt(db, student.id, att.id, rating, now, { seconds: 90 });
}

beforeAll(async () => {
  db = await createPgliteDb(null);
  ({ student } = await findOrCreateStudent(db, "Carol", "Lee"));
});

describe("study sessions", () => {
  let monday = "";

  it("saves a schedule, previews without writing, and starts once even if Start is pressed twice", async () => {
    expect(student.onboardedAt).toBeNull();
    await saveSchedule(db, student.id, { availability: AVAILABILITY, examDateOverride: null, supplementaryOptIn: false });
    [student] = await db.select().from(students).where(eq(students.id, student.id));
    expect(student.onboardedAt).not.toBeNull();

    const preview = previewNextSession(await loadStudentModel(db, student, MON));
    expect(preview).toMatchObject({ minutes: 90, scheduledMinutes: 90, firstOfDay: true });
    expect(await db.select().from(studySessions)).toHaveLength(0);

    monday = await startSession(db, student, null, MON);
    expect(await startSession(db, student, null, MON)).toBe(monday);
    const list = await itemsOf(monday);
    expect(list.map((i) => i.problemId)).toEqual([...preview.items, ...(preview.bonus ? [preview.bonus] : [])].map((i) => i.problemId));
    // 4.10 opens with two Foundation warm-ups, and the plan fits the time.
    expect((await Promise.all(list.slice(0, 2).map((i) => problemOf(i.problemId)))).map((p) => p.difficulty)).toEqual(["F", "F"]);
    expect(list[0].reason.code).toBe("new_warmup");
    expect(plannedMinutes(list)).toBeLessThanOrEqual(90 * 1.1);
  });

  it("links the attempt to its item, saves on-screen time, and goes on to the next item", async () => {
    const [first, second] = await itemsOf(monday);
    const att = await openAttempt(db, student.id, first.problemId, { origin: "plan", sessionItemId: first.id });
    expect((await db.select().from(attempts).where(eq(attempts.id, att.id)))[0]).toMatchObject({ origin: "plan", sessionItemId: first.id });
    expect((await itemsOf(monday))[0]).toMatchObject({ status: "active", attemptId: att.id });

    await addAttemptTime(db, student.id, att.id, 120);
    await addAttemptTime(db, student.id, att.id, 10_000); // one save adds at most 3 minutes
    const out = await rateAttempt(db, student.id, att.id, "got_it", MON, { seconds: 30 });
    expect((await db.select().from(attempts).where(eq(attempts.id, att.id)))[0].activeSeconds).toBe(120 + 180 + 30);
    expect(out.nextHref).toBe(`/practice/${encodeURIComponent(second.problemId)}?s=${second.id}`);
    expect((await db.select().from(problemTimeStats).where(eq(problemTimeStats.problemId, first.problemId)))[0]?.n).toBe(1);
    // Time can't be added once the attempt is rated.
    await addAttemptTime(db, student.id, att.id, 60);
    expect((await db.select().from(attempts).where(eq(attempts.id, att.id)))[0].activeSeconds).toBe(330);
  });

  it("puts an easier problem next after a Lost, and keeps the plan within the session length", async () => {
    const before = await itemsOf(monday);
    const out = await solve(before[1].id, "lost", MON);
    const list = await itemsOf(monday);
    const easier = list[2];
    expect(easier).toMatchObject({ track: "reinforcement", status: "pending" });
    expect(easier.reason.code).toBe("reinforce_easier");
    expect((await problemOf(easier.problemId)).difficulty).toBe("F");
    expect(out.nextLabel).toBe("Try an easier problem");
    expect(out.nextHref).toContain(`?s=${easier.id}`);
    expect(out.message).toMatch(/easier problem/);
    expect(plannedMinutes(list)).toBeLessThanOrEqual(90 * 1.1);

    const pending = await db
      .select()
      .from(reviewItems)
      .where(and(eq(reviewItems.studentId, student.id), eq(reviewItems.status, "pending")));
    expect(pending.map((p) => `${p.reason} ${p.dueDate}`).sort()).toEqual(["easier 2026-11-09", "lost 2026-11-10"]);
  });

  it("pauses and resumes, then completes the planned part and offers Keep going", async () => {
    await setSessionPaused(db, student.id, monday, true);
    expect((await sessionRow(monday)).status).toBe("paused");
    await setSessionPaused(db, student.id, monday, false);
    expect((await sessionRow(monday)).status).toBe("active");

    let list = await itemsOf(monday);
    let last = null;
    for (let next = nextEssential(list); next; next = nextEssential(list)) {
      last = await solve(next.id, "got_it", MON);
      list = await itemsOf(monday);
    }
    expect(last).toMatchObject({ sessionComplete: true, nextHref: "/session" });
    expect((await sessionRow(monday)).status).toBe("completed");

    const loaded = await loadStudentModel(db, student, MON);
    expect(openSessionOf(loaded.todaySessions)).toBeNull();
    const options = keepGoingFor(loaded);
    expect(options.length).toBeGreaterThan(0);
    const extra = await addKeepGoing(db, student, options[0].problemId, MON);
    expect(extra).toMatchObject({ essential: false, sessionId: monday, status: "pending" });
    expect(await addKeepGoing(db, student, options[0].problemId, MON)).toMatchObject({ id: extra!.id });
    expect(await addKeepGoing(db, student, "4.10-999", MON)).toBeNull();
  });

  it("opens the next day with yesterday's Challenge and the reinforcement that's due", async () => {
    const tuesday = await startSession(db, student, null, TUE);
    expect(tuesday).not.toBe(monday);
    let list = await itemsOf(tuesday);
    expect(list[0].track).toBe("challenge");
    expect(["challenge_next_day", "second_core"]).toContain(list[0].reason.code);
    // Monday's Lost problem is due today as targeted reinforcement.
    expect(list.some((i) => i.track === "reinforcement" && i.reason.code === "reinforce_lost")).toBe(true);
    // 4.10 is still the current unit, so nothing from it counts as a look-back yet.
    expect(list.some((i) => i.track === "lookback")).toBe(false);
    // Only look-backs can be skipped.
    expect(await skipItem(db, student.id, list[0].id, TUE)).toBeNull();

    // Finishing early moves the rest to next time.
    await finishSession(db, student.id, tuesday, TUE);
    list = await itemsOf(tuesday);
    expect(list.filter((i) => i.status === "pending" || i.status === "active")).toHaveLength(0);
    expect(list.some((i) => i.status === "dropped")).toBe(true);
    expect((await sessionRow(tuesday)).status).toBe("completed");
  });

  it("inserts a bridge look-back after the first problems in a new unit", async () => {
    ({ student } = await findOrCreateStudent(db, "Dan", "Moss"));
    await saveSchedule(db, student.id, { availability: AVAILABILITY, examDateOverride: null, supplementaryOptIn: false });
    const mon = await startSession(db, student, null, MON);
    for (let list = await itemsOf(mon), next = nextEssential(list); next; list = await itemsOf(mon), next = nextEssential(list)) {
      await solve(next.id, "got_it", MON);
    }
    // On Tuesday the student tries a 5.1 problem on their own, so 5.1 is now the current unit.
    const [p51] = await db
      .select()
      .from(problems)
      .where(and(eq(problems.sectionId, "5.1"), eq(problems.difficulty, "C")));
    const browse = await openAttempt(db, student.id, p51.id, { origin: "browse" });
    await rateAttempt(db, student.id, browse.id, "got_it", TUE);

    const tue = await startSession(db, student, null, TUE);
    let list = await itemsOf(tue);
    expect(list.some((i) => i.track === "lookback")).toBe(false);
    // Work in order up to the first new problem: it's the second rated problem in 5.1.
    for (const i of list) {
      if (i.track === "new") break;
      await solve(i.id, "got_it", TUE);
    }
    const firstNew = list.find((i) => i.track === "new")!;
    expect((await problemOf(firstNew.problemId)).sectionId).toBe("5.1");
    const out = await solve(firstNew.id, "got_it", TUE);
    list = await itemsOf(tue);
    const lookback = list[list.findIndex((i) => i.id === firstNew.id) + 1];
    expect(lookback).toMatchObject({ track: "lookback", status: "pending", essential: true });
    expect(lookback.reason).toEqual({ code: "lookback_bridge", params: { unit: "4.10", current: "5.1" } });
    expect((await problemOf(lookback.problemId)).sectionId).toBe("4.10");
    expect(out.nextLabel).toBe("Next: a look-back");
    expect(out.nextHref).toContain(`?s=${lookback.id}`);
    expect(plannedMinutes(list)).toBeLessThanOrEqual(90 * 1.1);

    // Skipping it: not offered again today, and it stays due for another day.
    expect(await skipItem(db, student.id, lookback.id, TUE)).not.toBeNull();
    expect((await itemsOf(tue)).find((i) => i.id === lookback.id)?.status).toBe("skipped");
    expect((await loadStudentModel(db, student, TUE)).model.lookbacks.due.some((u) => u.unitId === "4.10")).toBe(false);
    const wed = await loadStudentModel(db, student, new Date("2026-11-11T18:00:00Z"));
    expect(wed.model.lookbacks.due.some((u) => u.unitId === "4.10")).toBe(true);
  });
});

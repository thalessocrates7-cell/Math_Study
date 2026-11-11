/**
 * The Final Exam environment against a real (in-memory) Postgres with the real migrations and seed:
 * its chapters, its own schedule and sessions, and progress that never mixes with Integration Review.
 * The Final Exam's questions aren't in content/ yet, so a few stand-in problems are added here.
 */
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { createPgliteDb, type DB } from "../src/db/client";
import { problems, sections, students, studySessions, type Student } from "../src/db/schema";
import type { Availability } from "../src/lib/availability";
import { loadChecks, setCheck } from "../src/server/checklist";
import { loadStudentModel } from "../src/server/model";
import { openAttempt, rateAttempt, workspaceData } from "../src/server/practice";
import { prepOfProblem } from "../src/server/prep";
import { dueReviewCount, loadStudentState } from "../src/server/progress";
import { practiceHref, sessionItemsOf, startSession } from "../src/server/sessions";
import { getSettings, saveFinalSettings } from "../src/server/settings";
import { findOrCreateStudent, saveSchedule } from "../src/server/students";

let db: DB;
const MON = new Date("2026-11-09T18:00:00Z"); // 1 pm in New York
const DAILY: Availability = { v: 1, days: Object.fromEntries(["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((d) => [d, { sessions: 1, minutes: 60 }])) };
const FINAL_IDS = ["2-208", "2-213", "2-214", "2-223", "5-447", "5-448"];

async function addFinalProblem(id: string, difficulty: "F" | "C" | "Ch", concepts: string[]) {
  const [sectionId, n] = id.split("-");
  await db.insert(problems).values({
    id,
    sectionId,
    openstaxNumber: Number(n),
    difficulty,
    concepts,
    statement: `Stand-in question ${id}.`,
    hints: ["A hint."],
    answer: "An answer.",
    steps: [
      { title: "One", body: "Step one." },
      { title: "Two", body: "Step two." },
    ],
    check: { kind: "manual", note: "test" },
    sort: Number(n),
  });
}

async function rate(student: Student, problemId: string, rating: "got_it" | "shaky" | "lost", now = MON) {
  const att = await openAttempt(db, student.id, problemId, { origin: "plan" });
  return rateAttempt(db, student.id, att.id, rating, now);
}

beforeAll(async () => {
  db = await createPgliteDb(null);
  await addFinalProblem("2-208", "C", ["limit-facts"]);
  await addFinalProblem("2-213", "C", ["limits-algebra"]);
  await addFinalProblem("2-214", "F", ["limits-algebra"]);
  await addFinalProblem("2-223", "Ch", ["squeeze"]);
  await addFinalProblem("5-447", "C", ["definite-integrals"]);
  await addFinalProblem("5-448", "C", ["definite-integrals"]);
});

describe("the Final Exam environment", () => {
  it("seeds the three chapters as their own preparation, with the class date and time", async () => {
    const rows = await db.select({ id: sections.id, prep: sections.preparation }).from(sections);
    expect(rows.filter((r) => r.prep === "final").map((r) => r.id)).toEqual(["2", "4", "5"]);
    expect(rows.filter((r) => r.prep === "exam4").map((r) => r.id)).toContain("5.3");
    expect(await prepOfProblem(db, "2-208")).toBe("final");
    expect(await prepOfProblem(db, "5.3-148")).toBe("exam4");
    const settings = await getSettings(db);
    expect(settings.final).toEqual({ name: "Final Exam", date: "2026-12-14", time: "14:00" });
    expect(settings.examDate).toBe("2026-12-02");
  });

  it("keeps attempts, reviews and ticks apart, in both directions", async () => {
    const { student } = await findOrCreateStudent(db, "Fin", "Apart");
    const exam4Before = await loadStudentState(db, student.id, "exam4");
    await rate(student, "5.3-148", "got_it");
    const finalOut = await rate(student, "2-208", "lost");
    // What follows a Final Exam rating stays inside the Final Exam's pages.
    expect(finalOut.nextHref).toMatch(/^\/final-exam\/(practice|plan)/);

    const exam4 = await loadStudentState(db, student.id, "exam4");
    const final = await loadStudentState(db, student.id, "final");
    expect(exam4.rated.map((r) => r.problemId)).toEqual(["5.3-148"]);
    expect(final.rated.map((r) => r.problemId)).toEqual(["2-208"]);
    expect(exam4.pending.every((i) => !FINAL_IDS.includes(i.problemId))).toBe(true);
    expect(final.pending.length).toBeGreaterThan(0);
    expect(final.pending.every((i) => FINAL_IDS.includes(i.problemId))).toBe(true);
    expect(exam4.sections.map((s) => s.id)).not.toContain("2");
    expect(final.sections.map((s) => s.id)).toEqual(["2", "4", "5"]);
    // The Final Exam has no fixed plan: each chapter lists all of its active questions, by level.
    expect(final.assigned.filter((a) => a.sectionId === "2").map((a) => a.problemId)).toEqual(["2-214", "2-208", "2-213", "2-223"]);
    expect(exam4.assigned.length).toBe(exam4Before.assigned.length);

    expect([...(await loadChecks(db, student.id, "exam4"))]).toEqual(["5.3-148"]);
    expect([...(await loadChecks(db, student.id, "final"))]).toEqual(["2-208"]);
    await setCheck(db, student.id, "2-213", true);
    expect((await loadChecks(db, student.id, "exam4")).has("2-213")).toBe(false);

    const tomorrow = "2026-11-30";
    const dueFinal = await dueReviewCount(db, student.id, tomorrow, "final");
    expect(dueFinal).toBe(final.pending.filter((i) => i.dueDate <= tomorrow).length);
    expect(await dueReviewCount(db, student.id, tomorrow, "exam4")).toBe(exam4.pending.filter((i) => i.dueDate <= tomorrow).length);

    const model = await loadStudentModel(db, student, MON, "final");
    expect(model.prep).toBe("final");
    expect(model.routes.session).toBe("/final-exam/session");
    expect(model.problems.map((p) => p.id).sort()).toEqual([...FINAL_IDS].sort());
    expect([...model.attemptById.values()].every((a) => FINAL_IDS.includes(a.problemId))).toBe(true);
    expect(model.examDate).toBe("2026-12-14");
    expect(model.examTime).toBe("14:00");
    const regular = await loadStudentModel(db, student, MON, "exam4");
    expect(regular.problems.some((p) => FINAL_IDS.includes(p.id))).toBe(false);
    expect(regular.examTime).toBeNull();

    const ws = await workspaceData(db, student.id, "2-208");
    expect(ws?.prep).toBe("final");
    expect((await workspaceData(db, student.id, "5.3-148"))?.prep).toBe("exam4");
  });

  it("saves the Final Exam's schedule separately from Integration Review's", async () => {
    const { student } = await findOrCreateStudent(db, "Fin", "Schedule");
    await saveSchedule(db, student.id, { availability: DAILY, examDateOverride: "2026-12-16" }, "final");
    const [row] = await db.select().from(students).where(eq(students.id, student.id));
    expect(row.finalAvailability).toEqual(DAILY);
    expect(row.finalExamDateOverride).toBe("2026-12-16");
    expect(row.availability).toBeNull();
    expect(row.examDateOverride).toBeNull();
    expect(row.onboardedAt).toBeNull();
    const final = await loadStudentModel(db, row, MON, "final");
    const regular = await loadStudentModel(db, row, MON, "exam4");
    expect([final.hasSchedule, final.examDate]).toEqual([true, "2026-12-16"]);
    expect([regular.hasSchedule, regular.examDate]).toEqual([false, "2026-12-02"]);
  });

  it("numbers each environment's sessions on its own, so both can start the same day", async () => {
    const { student } = await findOrCreateStudent(db, "Fin", "Sessions");
    await saveSchedule(db, student.id, { availability: DAILY, examDateOverride: null }, "exam4");
    await saveSchedule(db, student.id, { availability: DAILY, examDateOverride: null }, "final");
    const [row] = await db.select().from(students).where(eq(students.id, student.id));
    const regular = await startSession(db, row, null, MON, "exam4");
    const final = await startSession(db, row, null, MON, "final");
    expect(final).not.toBe(regular);
    expect(await startSession(db, row, null, MON, "final")).toBe(final);
    const both = await db.select().from(studySessions).where(eq(studySessions.studentId, student.id));
    expect(both.map((s) => [s.preparation, s.slot]).sort()).toEqual([
      ["exam4", 1],
      ["final", 1],
    ]);
    const finalItems = await sessionItemsOf(db, final);
    expect(finalItems.length).toBeGreaterThan(0);
    expect(finalItems.every((i) => FINAL_IDS.includes(i.problemId))).toBe(true);
    expect((await sessionItemsOf(db, regular)).some((i) => FINAL_IDS.includes(i.problemId))).toBe(false);
    expect(practiceHref(finalItems[0], "final")).toBe(`/final-exam/practice/${finalItems[0].problemId}?s=${finalItems[0].id}`);

    // Solving the Final Exam session's first problem continues inside the Final Exam.
    const att = await openAttempt(db, student.id, finalItems[0].problemId, { origin: "plan", sessionItemId: finalItems[0].id });
    const out = await rateAttempt(db, student.id, att.id, "got_it", MON);
    expect(out.nextHref).toMatch(/^\/final-exam\/(practice\/[^?]+\?s=|session$)/);
    const finalModel = await loadStudentModel(db, row, MON, "final");
    const regularModel = await loadStudentModel(db, row, MON, "exam4");
    expect(finalModel.todaySessions.map((s) => s.session.id)).toEqual([final]);
    expect(regularModel.todaySessions.map((s) => s.session.id)).toEqual([regular]);
  });

  it("saves the Final Exam's class settings without touching Exam 4's", async () => {
    await saveFinalSettings(db, { name: "MTH 263 Final", date: "2026-12-15", time: "09:30" });
    const settings = await getSettings(db);
    expect(settings.final).toEqual({ name: "MTH 263 Final", date: "2026-12-15", time: "09:30" });
    expect([settings.examName, settings.examDate]).toEqual(["Exam 4", "2026-12-02"]);
  });
});

/**
 * The Final Exam environment against a real (in-memory) Postgres with the real migrations and seed:
 * its chapters and questions, its own schedule and sessions, and progress that never mixes with
 * Integration Review.
 */
import { eq, inArray } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { createPgliteDb, type DB } from "../src/db/client";
import { problems, sections, students, studySessions, type Student } from "../src/db/schema";
import { seedDatabase } from "../src/db/seed";
import { FINAL_PROBLEMS } from "../content/index";
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
/** A Final Exam question id: chapter 2–5 and an exercise number (Integration Review ids have a dot). */
const isFinal = (id: string) => /^[2-5]-\d+$/.test(id);

async function rate(student: Student, problemId: string, rating: "got_it" | "shaky" | "lost", now = MON) {
  const att = await openAttempt(db, student.id, problemId, { origin: "plan" });
  return rateAttempt(db, student.id, att.id, rating, now);
}

beforeAll(async () => {
  db = await createPgliteDb(null);
});

describe("the Final Exam environment", () => {
  it("seeds the four chapters and their 102 questions as their own preparation, with the class date and time", async () => {
    const rows = await db.select({ id: sections.id, prep: sections.preparation }).from(sections);
    // A plain select has no defined row order, so sort here (the app orders by `sort`; see the next test).
    expect(rows.filter((r) => r.prep === "final").map((r) => r.id).sort()).toEqual(["2", "3", "4", "5"]);
    const seeded = await db.select({ id: problems.id, image: problems.image }).from(problems);
    const finalRows = seeded.filter((p) => isFinal(p.id));
    expect(finalRows.map((p) => p.id).sort()).toEqual(FINAL_PROBLEMS.map((p) => p.id).sort());
    expect(finalRows.filter((p) => p.image).map((p) => p.id).sort()).toEqual(["2-212", "3-386", "3-387", "4-529", "4-530", "4-551"]);
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
    expect(exam4.pending.every((i) => !isFinal(i.problemId))).toBe(true);
    expect(final.pending.length).toBeGreaterThan(0);
    expect(final.pending.every((i) => isFinal(i.problemId))).toBe(true);
    expect(exam4.sections.map((s) => s.id)).not.toContain("2");
    expect(final.sections.map((s) => s.id)).toEqual(["2", "3", "4", "5"]);
    // The Final Exam has no fixed plan: each chapter lists all of its active questions, by level, then number.
    const ch2 = final.assigned.filter((a) => a.sectionId === "2");
    expect(ch2).toHaveLength(25);
    const order = { F: 0, C: 1, Ch: 2 } as const;
    for (let i = 1; i < ch2.length; i++) {
      const [a, b] = [ch2[i - 1], ch2[i]];
      expect(order[a.difficulty] < order[b.difficulty] || (a.difficulty === b.difficulty && a.openstaxNumber! < b.openstaxNumber!)).toBe(true);
    }
    expect(ch2[0].problemId).toBe("2-208");
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
    expect(model.problems).toHaveLength(102);
    expect(model.problems.every((p) => isFinal(p.id))).toBe(true);
    expect([...model.attemptById.values()].every((a) => isFinal(a.problemId))).toBe(true);
    expect(model.examDate).toBe("2026-12-14");
    expect(model.examTime).toBe("14:00");
    const regular = await loadStudentModel(db, student, MON, "exam4");
    expect(regular.problems.some((p) => isFinal(p.id))).toBe(false);
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
    expect(finalItems.every((i) => isFinal(i.problemId))).toBe(true);
    expect((await sessionItemsOf(db, regular)).some((i) => isFinal(i.problemId))).toBe(false);
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

describe("adding Chapter 3's questions to a database that already holds the earlier 79", () => {
  it("adds the 23 missing questions and leaves every rating, review and tick where it was", async () => {
    const old = await createPgliteDb(null);
    // Make this database look like the one from before 367–391 were added: take the 23 new questions out.
    const added = FINAL_PROBLEMS.filter((p) => p.section === "3" && p.openstax !== 386 && p.openstax !== 387).map((p) => p.id);
    expect(added).toHaveLength(23);
    await old.delete(problems).where(inArray(problems.id, added));
    const finalIds = async () => (await old.select({ id: problems.id }).from(problems)).map((p) => p.id).filter(isFinal);
    expect(await finalIds()).toHaveLength(79);

    // A student who already studied in both environments (including one of Chapter 3's two old questions).
    const { student } = await findOrCreateStudent(old, "Old", "Student");
    const rateOld = async (problemId: string, rating: "got_it" | "shaky" | "lost") => {
      const att = await openAttempt(old, student.id, problemId, { origin: "plan" });
      return rateAttempt(old, student.id, att.id, rating, MON);
    };
    await rateOld("5.3-148", "got_it");
    await rateOld("2-208", "lost");
    await rateOld("3-386", "shaky");
    await setCheck(old, student.id, "2-213", true);
    const before = {
      exam4: await loadStudentState(old, student.id, "exam4"),
      final: await loadStudentState(old, student.id, "final"),
      exam4Checks: [...(await loadChecks(old, student.id, "exam4"))],
      finalChecks: [...(await loadChecks(old, student.id, "final"))],
    };

    // The release's seed adds only what is missing.
    const { inserted } = await seedDatabase(old);
    expect(inserted).toBe(23);
    expect(await finalIds()).toHaveLength(102);

    const after = {
      exam4: await loadStudentState(old, student.id, "exam4"),
      final: await loadStudentState(old, student.id, "final"),
    };
    expect(after.exam4.rated).toEqual(before.exam4.rated);
    expect(after.exam4.pending).toEqual(before.exam4.pending);
    expect(after.exam4.assigned).toEqual(before.exam4.assigned);
    expect(after.final.rated).toEqual(before.final.rated);
    expect(after.final.pending).toEqual(before.final.pending);
    expect([...(await loadChecks(old, student.id, "exam4"))]).toEqual(before.exam4Checks);
    expect([...(await loadChecks(old, student.id, "final"))]).toEqual(before.finalChecks);
    // Chapter 3 now lists all 25 questions; the old rating is still on 386.
    expect(after.final.assigned.filter((a) => a.sectionId === "3")).toHaveLength(25);
    expect(after.final.rated.map((r) => r.problemId).sort()).toEqual(["2-208", "3-386"]);
    // Seeding again changes nothing.
    expect((await seedDatabase(old)).inserted).toBe(0);
  });
});

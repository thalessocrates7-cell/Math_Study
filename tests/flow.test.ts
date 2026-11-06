/** End-to-end domain flow against a real (in-memory) Postgres: PGlite with the real migrations and seed. */
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { createPgliteDb, type DB } from "../src/db/client";
import { assignments, attempts, problems, reviewItems } from "../src/db/schema";
import { classOverview, deleteProblem, studentDetail } from "../src/server/admin";
import { openAttempt, rateAttempt, recordAssist, saveNote, workspaceData } from "../src/server/practice";
import { dashboardStats, loadStudentState, recommend, reviewGroups } from "../src/server/progress";
import { findOrCreateStudent, mergeStudents } from "../src/server/students";

let db: DB;
const NOW = new Date("2026-11-05T18:00:00Z"); // 1 pm in New York

beforeAll(async () => {
  db = await createPgliteDb(null);
});

describe("student flow", () => {
  it("creates one account per name and a 15-problem plan per section", async () => {
    const a = await findOrCreateStudent(db, "Alice", "Smith");
    const b = await findOrCreateStudent(db, "alice", "SMITH");
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(b.student.id).toBe(a.student.id);
    const rows = await db.select().from(assignments).where(eq(assignments.studentId, a.student.id));
    expect(rows.length).toBe(8 * 15);
  });

  it("opens one attempt per problem, logs help, and rates Lost into an easier problem", async () => {
    const { student } = await findOrCreateStudent(db, "Alice", "Smith");
    const state = await loadStudentState(db, student.id);
    const next = recommend(state, "2026-11-05");
    expect(next.kind).toBe("plan");
    if (next.kind !== "plan") return;
    expect(next.sectionId).toBe("4.10");
    expect(next.position).toBe(1);

    const first = await openAttempt(db, student.id, next.problemId, { origin: "plan" });
    const again = await openAttempt(db, student.id, next.problemId, { origin: "plan" });
    expect(again.id).toBe(first.id);

    await recordAssist(db, student.id, first.id, "hint", 1);
    await recordAssist(db, student.id, first.id, "solution");
    const out = await rateAttempt(db, student.id, first.id, "lost", NOW);
    expect(out.alreadyRated).toBe(false);
    expect(out.nextHref).toMatch(/^\/practice\/4\.10-.+\?item=/);
    expect(out.message).toMatch(/easier problem/);

    const [row] = await db.select().from(attempts).where(eq(attempts.id, first.id));
    expect(row).toMatchObject({ rating: "lost", hintUsed: true, solutionViewed: true, ratedDay: "2026-11-05", nextReviewDate: "2026-11-06" });

    const pending = await db
      .select()
      .from(reviewItems)
      .where(and(eq(reviewItems.studentId, student.id), eq(reviewItems.status, "pending")));
    expect(pending.map((p) => p.reason).sort()).toEqual(["easier", "lost"]);

    // Rating twice is harmless.
    const twice = await rateAttempt(db, student.id, first.id, "got_it", NOW);
    expect(twice.alreadyRated).toBe(true);
    expect(twice.rating).toBe("lost");
  });

  it("serves the easier problem next, then returns to the plan", async () => {
    const { student } = await findOrCreateStudent(db, "Alice", "Smith");
    const state = await loadStudentState(db, student.id);
    const rec = recommend(state, "2026-11-05");
    expect(rec.kind).toBe("easier");
    if (rec.kind !== "easier") return;
    const itemId = new URL(`http://x${rec.href}`).searchParams.get("item");
    const ws = await workspaceData(db, student.id, rec.problemId, itemId);
    expect(ws?.reviewItem?.reason).toBe("easier");

    const att = await openAttempt(db, student.id, rec.problemId, { origin: "review", reviewItemId: itemId });
    const out = await rateAttempt(db, student.id, att.id, "got_it", NOW);
    expect(out.nextLabel).toBe("Next problem");
    expect(out.nextHref).toMatch(/^\/practice\/4\.10-/);
  });

  it("shows stats, queue groups and a 14-day Got It check", async () => {
    const { student } = await findOrCreateStudent(db, "Alice", "Smith");
    const state = await loadStudentState(db, student.id);
    const stats = dashboardStats(state, "2026-11-05");
    expect(stats.completed).toBe(2);
    expect(stats.toReview).toBe(1);
    const groups = reviewGroups(state, "2026-11-05");
    expect(groups.find((g) => g.key === "tomorrow")?.items.length).toBe(1);
    expect(groups.find((g) => g.key === "later")?.items[0]?.dueDate).toBe("2026-11-19");
  });

  it("saves notes and shows them in the workspace", async () => {
    const { student } = await findOrCreateStudent(db, "Alice", "Smith");
    const pid = "5.2-80";
    await saveNote(db, student.id, pid, "semicircle radius 2");
    expect((await workspaceData(db, student.id, pid))?.note).toBe("semicircle radius 2");
    await saveNote(db, student.id, pid, "   ");
    expect((await workspaceData(db, student.id, pid))?.note).toBe("");
  });
});

describe("admin", () => {
  it("summarizes the class and a student's history", async () => {
    await findOrCreateStudent(db, "Bob", "Jones");
    const overview = await classOverview(db, "2026-11-05", NOW);
    expect(overview.totalStudents).toBe(2);
    expect(overview.recent.length).toBeGreaterThan(0);
    expect(overview.bySection.find((b) => b.sectionId === "4.10")?.lost).toBe(1);
    const alice = overview.rows.find((r) => r.student.firstName === "Alice")!;
    const detail = await studentDetail(db, alice.student.id);
    expect(detail?.history.length).toBe(2);
    expect(detail?.ratingPercents.lost).toBe(50);
  });

  it("deactivates (not deletes) a problem with history, and refills plans", async () => {
    const { student } = await findOrCreateStudent(db, "Alice", "Smith");
    const [worked] = await db.select().from(attempts).where(eq(attempts.studentId, student.id));
    expect(await deleteProblem(db, worked.problemId)).toBe("deactivated");
    const [p] = await db.select().from(problems).where(eq(problems.id, worked.problemId));
    expect(p.active).toBe(false);
    const state = await loadStudentState(db, student.id);
    expect(state.assigned.filter((a) => a.sectionId === "4.10").length).toBe(15);
  });

  it("merges duplicate accounts", async () => {
    const dup = await findOrCreateStudent(db, "Bobby", "Jones");
    const bob = await findOrCreateStudent(db, "Bob", "Jones");
    const att = await openAttempt(db, dup.student.id, "5.1-2", { origin: "plan" });
    await rateAttempt(db, dup.student.id, att.id, "got_it", NOW);
    await mergeStudents(db, dup.student.id, bob.student.id);
    const detail = await studentDetail(db, bob.student.id);
    expect(detail?.history.some((h) => h.problemId === "5.1-2")).toBe(true);
    expect(await studentDetail(db, dup.student.id)).toBeNull();
  });
});

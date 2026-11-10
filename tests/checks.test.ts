/** Study Plan checkboxes against a real (in-memory) Postgres: PGlite with the real migrations and seed. */
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { createPgliteDb, type DB } from "../src/db/client";
import { attempts, problemChecks } from "../src/db/schema";
import { loadChecks, setCheck } from "../src/server/checklist";
import { openAttempt, rateAttempt, workspaceData } from "../src/server/practice";
import { deleteStudent, findOrCreateStudent, mergeStudents } from "../src/server/students";

let db: DB;
const NOW = new Date("2026-11-05T18:00:00Z");

beforeAll(async () => {
  db = await createPgliteDb(null);
});

describe("study plan checkboxes", () => {
  it("rating ticks the problem, and unticking keeps the attempt", async () => {
    const { student } = await findOrCreateStudent(db, "Tick", "One");
    const att = await openAttempt(db, student.id, "5.3-148", { origin: "plan" });
    expect((await loadChecks(db, student.id)).has("5.3-148")).toBe(false);
    await rateAttempt(db, student.id, att.id, "got_it", NOW);
    expect((await loadChecks(db, student.id)).has("5.3-148")).toBe(true);

    expect(await setCheck(db, student.id, "5.3-148", false)).toBe(true);
    expect((await loadChecks(db, student.id)).has("5.3-148")).toBe(false);
    const [row] = await db.select().from(attempts).where(eq(attempts.id, att.id));
    expect(row.rating).toBe("got_it");

    // Ticking by hand works, twice is harmless, and an unknown problem is refused.
    expect(await setCheck(db, student.id, "5.3-150", true)).toBe(true);
    expect(await setCheck(db, student.id, "5.3-150", true)).toBe(true);
    expect([...(await loadChecks(db, student.id))].sort()).toEqual(["5.3-150"]);
    expect(await setCheck(db, student.id, "9.9-1", true)).toBe(false);
  });

  it("'Next problem' and the counter follow the section and level", async () => {
    const { student } = await findOrCreateStudent(db, "Tick", "Two");
    const ws = await workspaceData(db, student.id, "5.3-144");
    expect(ws?.problem.difficulty).toBe("Ch");
    expect(ws?.total).toBe(5);
    expect(ws?.position).toBe(1);
    expect(ws?.done).toBe(0);

    const att = await openAttempt(db, student.id, "5.3-144", { origin: "plan" });
    const out = await rateAttempt(db, student.id, att.id, "shaky", NOW);
    // The next stop is the next Challenge problem in 5.3 (or the easier problem a Shaky may add).
    expect(out.nextHref).toMatch(/^\/practice\/5\.3-/);
    expect((await workspaceData(db, student.id, "5.3-144"))?.done).toBe(1);
  });

  it("goes back to the Study Plan when the level is finished", async () => {
    const { student } = await findOrCreateStudent(db, "Tick", "Three");
    const ws = await workspaceData(db, student.id, "5.3-144");
    expect(ws).not.toBeNull();
    const ids = ["5.3-144", "5.3-147", "5.3-152", "5.3-160", "5.3-195"];
    for (const id of ids.slice(1)) await setCheck(db, student.id, id, true);
    const att = await openAttempt(db, student.id, "5.3-144", { origin: "plan" });
    const out = await rateAttempt(db, student.id, att.id, "got_it", NOW);
    expect(out.nextHref).toBe("/plan?section=5.3&level=challenge");
  });

  it("merging moves ticks without duplicates, and deleting a student removes theirs", async () => {
    const a = await findOrCreateStudent(db, "Tick", "Four");
    const b = await findOrCreateStudent(db, "Tick", "Five");
    await setCheck(db, a.student.id, "5.1-3", true);
    await setCheck(db, a.student.id, "5.1-2", true);
    await setCheck(db, b.student.id, "5.1-2", true);
    await mergeStudents(db, a.student.id, b.student.id);
    expect([...(await loadChecks(db, b.student.id))].sort()).toEqual(["5.1-2", "5.1-3"]);
    expect((await loadChecks(db, a.student.id)).size).toBe(0);

    await deleteStudent(db, b.student.id);
    expect(await db.select().from(problemChecks).where(eq(problemChecks.studentId, b.student.id))).toHaveLength(0);
  });
});

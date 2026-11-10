import { and, count, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import type { DB, Q } from "../db/client";
import { assignments, attempts, notes, problemChecks, reviewItems, students, type Student } from "../db/schema";
import { nameKey, normalizeName } from "../lib/names";
import type { ScheduleValue } from "../lib/schedule";
import { ensureAssignments } from "./plan";

export type Theme = "light" | "dark" | "system";
export const THEMES: Theme[] = ["light", "dark", "system"];

/** Name-only sign-in: the same (normalized) name always maps to the same account. */
export async function findOrCreateStudent(db: DB, first: string, last: string): Promise<{ student: Student; created: boolean }> {
  const key = nameKey(first, last);
  const inserted = await db.insert(students).values({ firstName: first, lastName: last, nameKey: key }).onConflictDoNothing().returning();
  let student: Student;
  let created = false;
  if (inserted.length > 0) {
    student = inserted[0];
    created = true;
  } else {
    const [existing] = await db.update(students).set({ lastSeenAt: new Date() }).where(eq(students.nameKey, key)).returning();
    student = existing;
  }
  await ensureAssignments(db, student.id);
  return { student, created };
}

export async function getStudent(q: Q, id: string): Promise<Student | undefined> {
  const [row] = await q.select().from(students).where(eq(students.id, id));
  return row;
}

export async function touchStudent(q: Q, id: string): Promise<void> {
  await q.update(students).set({ lastSeenAt: new Date() }).where(eq(students.id, id));
}

export async function setStudentTheme(q: Q, id: string, theme: Theme): Promise<void> {
  await q.update(students).set({ theme }).where(eq(students.id, id));
}

/** Saves the study schedule. The first save also marks the student as set up (onboarded). */
export async function saveSchedule(q: Q, id: string, value: ScheduleValue): Promise<void> {
  await q
    .update(students)
    .set({
      availability: value.availability,
      examDateOverride: value.examDateOverride,
      onboardedAt: sql`coalesce(${students.onboardedAt}, now())`,
    })
    .where(eq(students.id, id));
}

/** Rated problems so far: students with history see a one-time note about the upgrade. */
export async function ratedAttemptCount(q: Q, id: string): Promise<number> {
  const [row] = await q
    .select({ n: count() })
    .from(attempts)
    .where(and(eq(attempts.studentId, id), sql`${attempts.ratedAt} is not null`));
  return row?.n ?? 0;
}

export type RenameResult = { ok: true } | { ok: false; error: string } | { ok: false; conflictWith: Student };

export async function renameStudent(q: Q, id: string, firstRaw: string, lastRaw: string): Promise<RenameResult> {
  const n = normalizeName(firstRaw, lastRaw);
  if (!n.ok) return { ok: false, error: n.error };
  const [other] = await q.select().from(students).where(and(eq(students.nameKey, n.key), ne(students.id, id)));
  if (other) return { ok: false, conflictWith: other };
  await q.update(students).set({ firstName: n.first, lastName: n.last, nameKey: n.key }).where(eq(students.id, id));
  return { ok: true };
}

/**
 * Moves everything from `sourceId` into `targetId` (for duplicate accounts), then deletes the source.
 * The target keeps its own study plan; history, reviews and notes are combined.
 */
export async function mergeStudents(db: DB, sourceId: string, targetId: string): Promise<void> {
  if (sourceId === targetId) return;
  await db.transaction(async (tx) => {
    // Open (unrated) attempts carry no history; drop the source's to avoid clashing with the target's.
    await tx.delete(attempts).where(and(eq(attempts.studentId, sourceId), isNull(attempts.ratedAt)));
    await tx.update(attempts).set({ studentId: targetId }).where(eq(attempts.studentId, sourceId));

    const targetPending = await tx
      .select({ problemId: reviewItems.problemId })
      .from(reviewItems)
      .where(and(eq(reviewItems.studentId, targetId), eq(reviewItems.status, "pending")));
    const clash = targetPending.map((r) => r.problemId);
    if (clash.length > 0) {
      await tx
        .update(reviewItems)
        .set({ status: "done", doneAt: new Date() })
        .where(and(eq(reviewItems.studentId, sourceId), eq(reviewItems.status, "pending"), inArray(reviewItems.problemId, clash)));
    }
    await tx.update(reviewItems).set({ studentId: targetId }).where(eq(reviewItems.studentId, sourceId));

    const sourceNotes = await tx.select().from(notes).where(eq(notes.studentId, sourceId));
    for (const note of sourceNotes) {
      const [existing] = await tx
        .select()
        .from(notes)
        .where(and(eq(notes.studentId, targetId), eq(notes.problemId, note.problemId)));
      if (existing) {
        await tx
          .update(notes)
          .set({ text: `${existing.text}\n\n${note.text}`, updatedAt: new Date() })
          .where(and(eq(notes.studentId, targetId), eq(notes.problemId, note.problemId)));
      } else {
        await tx.insert(notes).values({ studentId: targetId, problemId: note.problemId, text: note.text });
      }
    }
    await tx.delete(notes).where(eq(notes.studentId, sourceId));
    // Ticks move across; the target keeps its own where both ticked the same problem.
    const sourceChecks = await tx.select().from(problemChecks).where(eq(problemChecks.studentId, sourceId));
    if (sourceChecks.length > 0) {
      await tx
        .insert(problemChecks)
        .values(sourceChecks.map((c) => ({ studentId: targetId, problemId: c.problemId, checkedAt: c.checkedAt })))
        .onConflictDoNothing();
    }
    await tx.delete(problemChecks).where(eq(problemChecks.studentId, sourceId));
    await tx.delete(assignments).where(eq(assignments.studentId, sourceId));
    await tx.delete(students).where(eq(students.id, sourceId));
  });
  await ensureAssignments(db, targetId);
}

export async function deleteStudent(q: Q, id: string): Promise<void> {
  await q.delete(students).where(eq(students.id, id));
}

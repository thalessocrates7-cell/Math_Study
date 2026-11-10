import { and, eq } from "drizzle-orm";
import type { Q } from "../db/client";
import { problemChecks, problems } from "../db/schema";

/** The problems this student has ticked on the Study Plan. */
export async function loadChecks(q: Q, studentId: string): Promise<Set<string>> {
  const rows = await q.select({ problemId: problemChecks.problemId }).from(problemChecks).where(eq(problemChecks.studentId, studentId));
  return new Set(rows.map((r) => r.problemId));
}

/** Ticks or unticks one problem. Ratings and history are never touched. Returns false for an unknown problem. */
export async function setCheck(q: Q, studentId: string, problemId: string, on: boolean): Promise<boolean> {
  const [p] = await q.select({ id: problems.id }).from(problems).where(eq(problems.id, problemId));
  if (!p) return false;
  if (on) await q.insert(problemChecks).values({ studentId, problemId }).onConflictDoNothing();
  else await q.delete(problemChecks).where(and(eq(problemChecks.studentId, studentId), eq(problemChecks.problemId, problemId)));
  return true;
}

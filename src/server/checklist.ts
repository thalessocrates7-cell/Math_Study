import { and, eq, inArray } from "drizzle-orm";
import type { Q } from "../db/client";
import { problemChecks, problems } from "../db/schema";
import type { Prep } from "../lib/prep";
import { prepProblemIds } from "./prep";

/** The problems this student has ticked on the Study Plan (only one preparation's, when given). */
export async function loadChecks(q: Q, studentId: string, prep?: Prep): Promise<Set<string>> {
  const where = prep
    ? and(eq(problemChecks.studentId, studentId), inArray(problemChecks.problemId, prepProblemIds(q, prep)))
    : eq(problemChecks.studentId, studentId);
  const rows = await q.select({ problemId: problemChecks.problemId }).from(problemChecks).where(where);
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

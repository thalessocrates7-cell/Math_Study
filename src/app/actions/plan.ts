"use server";

import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { PROBLEM_ID_RE as ID_RE } from "@/lib/ids";
import { setCheck } from "@/server/checklist";

/** The Study Plan checkbox: saves a tick (or removes it) on the student's account. */
export async function toggleCheckAction(problemId: string, checked: boolean): Promise<{ ok: true } | { error: string }> {
  const student = await requireStudent();
  if (typeof problemId !== "string" || !ID_RE.test(problemId) || typeof checked !== "boolean") return { error: "That problem could not be saved." };
  const db = await getDb();
  const ok = await setCheck(db, student.id, problemId, checked);
  return ok ? { ok: true } : { error: "That problem could not be found." };
}

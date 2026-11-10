"use server";

import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { setCheck } from "@/server/checklist";

const ID_RE = /^[0-9]+\.[0-9]+-[A-Za-z0-9]+$/;

/** The Study Plan checkbox: saves a tick (or removes it) on the student's account. */
export async function toggleCheckAction(problemId: string, checked: boolean): Promise<{ ok: true } | { error: string }> {
  const student = await requireStudent();
  if (typeof problemId !== "string" || !ID_RE.test(problemId) || typeof checked !== "boolean") return { error: "That problem could not be saved." };
  const db = await getDb();
  const ok = await setCheck(db, student.id, problemId, checked);
  return ok ? { ok: true } : { error: "That problem could not be found." };
}

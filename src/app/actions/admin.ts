"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SECTIONS } from "@content/index";
import type { Difficulty, Step } from "@content/types";
import { getDb } from "@/db/client";
import { students } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { isISODate } from "@/lib/dates";
import {
  applyPlan,
  deleteProblem,
  planRows,
  saveProblem,
  validatePlan,
  validateProblemInput,
  type ProblemInput,
} from "@/server/admin";
import { getProblem } from "@/server/practice";
import { saveSettings } from "@/server/settings";
import { deleteStudent, getStudent, mergeStudents, renameStudent } from "@/server/students";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type RenameState = { error?: string; ok?: boolean; conflict?: { id: string; name: string } };

export async function renameStudentAction(_prev: RenameState, formData: FormData): Promise<RenameState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) return { error: "Unknown student." };
  const db = await getDb();
  const res = await renameStudent(db, id, String(formData.get("first") ?? ""), String(formData.get("last") ?? ""));
  if (res.ok) {
    revalidatePath("/admin", "layout");
    return { ok: true };
  }
  if ("conflictWith" in res) {
    return {
      error: `Another student is already named ${res.conflictWith.firstName} ${res.conflictWith.lastName}.`,
      conflict: { id: res.conflictWith.id, name: `${res.conflictWith.firstName} ${res.conflictWith.lastName}` },
    };
  }
  return { error: res.error };
}

export async function mergeStudentAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const source = String(formData.get("source") ?? "");
  const target = String(formData.get("target") ?? "");
  if (!UUID_RE.test(source) || !UUID_RE.test(target) || source === target) return;
  const db = await getDb();
  if (!(await getStudent(db, source)) || !(await getStudent(db, target))) return;
  await mergeStudents(db, source, target);
  revalidatePath("/admin", "layout");
  redirect(`/admin/students/${target}?merged=1`);
}

export async function deleteStudentAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) return;
  const db = await getDb();
  await deleteStudent(db, id);
  revalidatePath("/admin", "layout");
  redirect("/admin/students?deleted=1");
}

export async function purgeStudentsAction(formData: FormData): Promise<void> {
  await requireAdmin();
  if (String(formData.get("confirm") ?? "") !== "DELETE") redirect("/admin/settings?purge=cancelled");
  const db = await getDb();
  await db.delete(students);
  revalidatePath("/admin", "layout");
  redirect("/admin/settings?purge=done");
}

export type ProblemState = { error?: string };

export async function saveProblemAction(_prev: ProblemState, formData: FormData): Promise<ProblemState> {
  await requireAdmin();
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "The form data could not be read. Reload and try again." };
  }
  const p = raw as Partial<ProblemInput> & { mode?: string };
  const mode = p.mode === "create" ? "create" : "update";
  const steps: Step[] = Array.isArray(p.steps)
    ? p.steps.map((s) => ({ title: String((s as Step)?.title ?? "").trim(), body: String((s as Step)?.body ?? "").trim() }))
    : [];
  const input: ProblemInput = {
    id: String(p.id ?? "").trim(),
    sectionId: String(p.sectionId ?? ""),
    openstaxNumber: p.openstaxNumber === null || p.openstaxNumber === undefined || String(p.openstaxNumber) === "" ? null : Number(p.openstaxNumber),
    difficulty: (["F", "C", "Ch"].includes(String(p.difficulty)) ? p.difficulty : "C") as Difficulty,
    concepts: Array.isArray(p.concepts) ? p.concepts.map(String).slice(0, 12) : [],
    statement: String(p.statement ?? "").slice(0, 8000),
    hints: Array.isArray(p.hints) ? p.hints.map((h) => String(h).trim()).filter(Boolean).slice(0, 10) : [],
    answer: String(p.answer ?? "").slice(0, 4000),
    steps: steps.slice(0, 20),
    active: Boolean(p.active),
  };
  if (input.openstaxNumber !== null && (!Number.isInteger(input.openstaxNumber) || input.openstaxNumber < 1)) {
    return { error: "The OpenStax exercise number must be a positive whole number (or empty)." };
  }
  const problem = validateProblemInput(input, SECTIONS.map((s) => s.id));
  if (problem) return { error: problem };
  const db = await getDb();
  const existing = await getProblem(db, input.id);
  if (mode === "create" && existing) return { error: `A problem with ID ${input.id} already exists.` };
  if (mode === "update" && !existing) return { error: "That problem no longer exists." };
  await saveProblem(db, input, mode);
  revalidatePath("/", "layout");
  redirect(`/admin/problems/${encodeURIComponent(input.id)}?saved=1`);
}

export async function deleteProblemAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const db = await getDb();
  if (!(await getProblem(db, id))) redirect("/admin/problems");
  const result = await deleteProblem(db, id);
  revalidatePath("/", "layout");
  redirect(result === "deleted" ? "/admin/problems?deleted=1" : `/admin/problems/${encodeURIComponent(id)}?retired=1`);
}

export type PlanState = { error?: string; ok?: boolean; rebalanced?: number };

export async function savePlanAction(_prev: PlanState, formData: FormData): Promise<PlanState> {
  await requireAdmin();
  const db = await getDb();
  const current = await planRows(db);
  const rows = current.map((r) => ({
    sectionId: r.sectionId,
    foundation: Number(formData.get(`${r.sectionId}:F`)),
    core: Number(formData.get(`${r.sectionId}:C`)),
    challenge: Number(formData.get(`${r.sectionId}:Ch`)),
  }));
  const error = validatePlan(rows, current);
  if (error) return { error };
  const rebalanced = await applyPlan(db, rows, formData.get("updateExisting") === "on");
  revalidatePath("/", "layout");
  return { ok: true, rebalanced };
}

export type SettingsState = { error?: string; ok?: boolean };

export async function saveSettingsAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireAdmin();
  const examName = String(formData.get("examName") ?? "").trim();
  const examDate = String(formData.get("examDate") ?? "");
  if (examName.length < 2 || examName.length > 60) return { error: "Exam name must be 2 to 60 characters." };
  if (!isISODate(examDate)) return { error: "Enter a valid exam date." };
  const db = await getDb();
  await saveSettings(db, { examName, examDate });
  revalidatePath("/", "layout");
  return { ok: true };
}

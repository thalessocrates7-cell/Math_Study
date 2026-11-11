"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { todayISO } from "@/lib/dates";
import { parsePrep } from "@/lib/prep";
import { parseScheduleForm, type ScheduleField } from "@/lib/schedule";
import { getExam } from "@/server/settings";
import { saveSchedule } from "@/server/students";

export type ScheduleState = { error?: string; field?: ScheduleField; saved?: boolean };

/** Saves the study schedule of the form's preparation (Integration Review, or the Final Exam's own). */
export async function saveScheduleAction(_prev: ScheduleState, formData: FormData): Promise<ScheduleState> {
  const student = await requireStudent();
  const prep = parsePrep(formData.get("prep"));
  const db = await getDb();
  const exam = await getExam(db, prep);
  const res = parseScheduleForm(
    {
      availability: String(formData.get("availability") ?? ""),
      examDate: String(formData.get("examDate") ?? ""),
    },
    { today: todayISO(), classExamDate: exam.classDate },
  );
  if (!res.ok) return { error: res.error, field: res.field };
  await saveSchedule(db, student.id, res.value, prep);
  revalidatePath("/", "layout");
  return { saved: true };
}

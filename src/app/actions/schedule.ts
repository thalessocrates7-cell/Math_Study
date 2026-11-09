"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { todayISO } from "@/lib/dates";
import { parseScheduleForm, type ScheduleField } from "@/lib/schedule";
import { getSettings } from "@/server/settings";
import { saveSchedule } from "@/server/students";

export type ScheduleState = { error?: string; field?: ScheduleField; saved?: boolean };

export async function saveScheduleAction(_prev: ScheduleState, formData: FormData): Promise<ScheduleState> {
  const student = await requireStudent();
  const db = await getDb();
  const settings = await getSettings(db);
  const res = parseScheduleForm(
    {
      availability: String(formData.get("availability") ?? ""),
      examDate: String(formData.get("examDate") ?? ""),
      supplementary: formData.get("supplementary") === "on",
    },
    { today: todayISO(), classExamDate: settings.examDate },
  );
  if (!res.ok) return { error: res.error, field: res.field };
  await saveSchedule(db, student.id, res.value);
  revalidatePath("/", "layout");
  if (formData.get("setup") === "1") redirect("/dashboard");
  return { saved: true };
}

import { eq } from "drizzle-orm";
import { DEFAULT_EXAM, FINAL_EXAM } from "../../content/index";
import type { Q } from "../db/client";
import { settings, type Student } from "../db/schema";
import type { Prep } from "../lib/prep";

export type ExamSettings = { examName: string; examDate: string };
/** The Final Exam's class settings: name, date, and the start time as 24-hour New York time ("14:00"). */
export type FinalExamSettings = { name: string; date: string; time: string };

type SettingsRow = typeof settings.$inferSelect;

/** One preparation's exam: its name, the class date, and the start time (the Final Exam only). */
export type ExamInfo = { name: string; classDate: string; time: string | null };

export function examFor(prep: Prep, row: SettingsRow | undefined): ExamInfo {
  if (prep === "final") {
    return { name: row?.finalExamName ?? FINAL_EXAM.name, classDate: row?.finalExamDate ?? FINAL_EXAM.date, time: row?.finalExamTime ?? FINAL_EXAM.time };
  }
  return { name: row?.examName ?? DEFAULT_EXAM.name, classDate: row?.examDate ?? DEFAULT_EXAM.date, time: null };
}

/** The student's own values for one preparation: their study schedule and their own exam date. */
export function studentFor(prep: Prep, student: Student): { availability: unknown; examDateOverride: string | null } {
  return prep === "final"
    ? { availability: student.finalAvailability, examDateOverride: student.finalExamDateOverride }
    : { availability: student.availability, examDateOverride: student.examDateOverride };
}

export async function getSettings(q: Q): Promise<ExamSettings & { final: FinalExamSettings }> {
  const [row] = await q.select().from(settings).where(eq(settings.id, 1));
  const exam4 = examFor("exam4", row);
  const final = examFor("final", row);
  return { examName: exam4.name, examDate: exam4.classDate, final: { name: final.name, date: final.classDate, time: final.time ?? FINAL_EXAM.time } };
}

/** One preparation's exam settings (with the class date). */
export async function getExam(q: Q, prep: Prep): Promise<ExamInfo> {
  const [row] = await q.select().from(settings).where(eq(settings.id, 1));
  return examFor(prep, row);
}

export async function saveSettings(q: Q, value: ExamSettings): Promise<void> {
  await q
    .insert(settings)
    .values({ id: 1, examName: value.examName, examDate: value.examDate })
    .onConflictDoUpdate({ target: settings.id, set: { examName: value.examName, examDate: value.examDate, updatedAt: new Date() } });
}

/** Saves the Final Exam's class settings without touching the Integration Review exam. */
export async function saveFinalSettings(q: Q, value: FinalExamSettings): Promise<void> {
  const set = { finalExamName: value.name, finalExamDate: value.date, finalExamTime: value.time };
  await q
    .insert(settings)
    .values({ id: 1, examName: DEFAULT_EXAM.name, examDate: DEFAULT_EXAM.date, ...set })
    .onConflictDoUpdate({ target: settings.id, set: { ...set, updatedAt: new Date() } });
}

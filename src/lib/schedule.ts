/**
 * The study-schedule form: availability and the student's own exam date.
 * Pure so it can be tested; the server action passes the raw form values in.
 */
import { type Availability, validateAvailability } from "./availability";
import { addDays, isISODate } from "./dates";

export type ScheduleValue = {
  availability: Availability;
  /** null = follow the class exam date (so a change by the instructor reaches this student). */
  examDateOverride: string | null;
};

export type ScheduleField = "days" | "examDate";
export type ScheduleResult = { ok: true; value: ScheduleValue } | { ok: false; error: string; field: ScheduleField };

export type ScheduleRaw = { availability: string; examDate: string };

export function parseScheduleForm(raw: ScheduleRaw, ctx: { today: string; classExamDate: string }): ScheduleResult {
  let json: unknown = null;
  try {
    json = JSON.parse(raw.availability);
  } catch {
    json = null;
  }
  const av = validateAvailability(json);
  if (!av.ok) return { ok: false, error: av.error, field: "days" };

  const date = raw.examDate.trim();
  let examDateOverride: string | null = null;
  if (date !== "" && date !== ctx.classExamDate) {
    if (!isISODate(date)) return { ok: false, error: "Enter the exam date as a full date.", field: "examDate" };
    if (date < ctx.today) return { ok: false, error: "The exam date can't be in the past.", field: "examDate" };
    if (date > addDays(ctx.today, 366)) return { ok: false, error: "Choose an exam date within the next year.", field: "examDate" };
    examDateOverride = date;
  }
  return { ok: true, value: { availability: av.value, examDateOverride } };
}

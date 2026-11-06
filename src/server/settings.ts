import { eq } from "drizzle-orm";
import { DEFAULT_EXAM } from "../../content/index";
import type { Q } from "../db/client";
import { settings } from "../db/schema";

export type ExamSettings = { examName: string; examDate: string };

export async function getSettings(q: Q): Promise<ExamSettings> {
  const [row] = await q.select().from(settings).where(eq(settings.id, 1));
  return row ? { examName: row.examName, examDate: row.examDate } : { examName: DEFAULT_EXAM.name, examDate: DEFAULT_EXAM.date };
}

export async function saveSettings(q: Q, value: ExamSettings): Promise<void> {
  await q
    .insert(settings)
    .values({ id: 1, examName: value.examName, examDate: value.examDate })
    .onConflictDoUpdate({ target: settings.id, set: { examName: value.examName, examDate: value.examDate, updatedAt: new Date() } });
}

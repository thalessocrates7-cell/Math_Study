"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import {
  openAttempt,
  PracticeError,
  rateAttempt,
  recordAssist,
  saveNote,
  type AssistKind,
  type AttemptState,
  type RateOutcome,
} from "@/server/practice";

const ID_RE = /^[0-9]+\.[0-9]+-[A-Za-z0-9]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function openAttemptAction(problemId: string, itemId: string | null): Promise<AttemptState | null> {
  const student = await requireStudent();
  if (!ID_RE.test(problemId)) return null;
  const db = await getDb();
  try {
    return await openAttempt(db, student.id, problemId, {
      origin: itemId ? "review" : "plan",
      reviewItemId: itemId && UUID_RE.test(itemId) ? itemId : null,
    });
  } catch (err) {
    if (err instanceof PracticeError) return null;
    throw err;
  }
}

export async function assistAction(attemptId: string, kind: AssistKind, hintsShown = 1): Promise<void> {
  const student = await requireStudent();
  if (!UUID_RE.test(attemptId) || !["hint", "answer", "solution"].includes(kind)) return;
  const db = await getDb();
  await recordAssist(db, student.id, attemptId, kind, Number.isFinite(hintsShown) ? hintsShown : 1);
}

export async function rateAction(attemptId: string, rating: "got_it" | "shaky" | "lost"): Promise<RateOutcome | { error: string }> {
  const student = await requireStudent();
  if (!UUID_RE.test(attemptId) || !["got_it", "shaky", "lost"].includes(rating)) return { error: "That rating could not be saved." };
  const db = await getDb();
  try {
    const out = await rateAttempt(db, student.id, attemptId, rating);
    revalidatePath("/", "layout");
    return out;
  } catch (err) {
    if (err instanceof PracticeError) return { error: "That attempt was not found. Reload the page and try again." };
    throw err;
  }
}

export async function saveNoteAction(problemId: string, text: string): Promise<{ ok: boolean }> {
  const student = await requireStudent();
  if (!ID_RE.test(problemId) || typeof text !== "string") return { ok: false };
  const db = await getDb();
  await saveNote(db, student.id, problemId, text);
  return { ok: true };
}

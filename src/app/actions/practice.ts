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
import { setSessionPaused } from "@/server/sessions";

const ID_RE = /^[0-9]+\.[0-9]+-[A-Za-z0-9]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuidOrNull = (v: string | null | undefined) => (v && UUID_RE.test(v) ? v : null);

export async function openAttemptAction(problemId: string, itemId: string | null, sessionItemId: string | null = null): Promise<AttemptState | null> {
  const student = await requireStudent();
  if (!ID_RE.test(problemId)) return null;
  const db = await getDb();
  try {
    return await openAttempt(db, student.id, problemId, {
      origin: itemId ? "review" : "plan",
      reviewItemId: uuidOrNull(itemId),
      sessionItemId: uuidOrNull(sessionItemId),
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

/** `seconds` is the on-screen time not yet saved (the rest arrives through /api/time). */
export async function rateAction(attemptId: string, rating: "got_it" | "shaky" | "lost", seconds = 0): Promise<RateOutcome | { error: string }> {
  const student = await requireStudent();
  if (!UUID_RE.test(attemptId) || !["got_it", "shaky", "lost"].includes(rating)) return { error: "That rating could not be saved." };
  const db = await getDb();
  try {
    const out = await rateAttempt(db, student.id, attemptId, rating, new Date(), { seconds: Number(seconds) || 0 });
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

/** The workspace's Pause / Resume (the timer runs in the browser; this is what the dashboard shows). */
export async function pauseSessionAction(sessionId: string, paused: boolean): Promise<void> {
  const student = await requireStudent();
  if (!UUID_RE.test(sessionId)) return;
  const db = await getDb();
  await setSessionPaused(db, student.id, sessionId, paused === true);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { PROBLEM_ID_RE, UUID_RE } from "@/lib/ids";
import { parsePrep, routesFor } from "@/lib/prep";
import {
  addKeepGoing,
  finishSession,
  nextEssential,
  nextOptional,
  ownSession,
  practiceHref,
  sessionItemsOf,
  skipItem,
  startSession,
} from "@/server/sessions";

/** Start (or continue) today's session of the form's preparation and go straight to its first problem. */
export async function startSessionAction(formData: FormData): Promise<void> {
  const student = await requireStudent();
  const prep = parsePrep(formData.get("prep"));
  const raw = Number(formData.get("minutes"));
  const db = await getDb();
  const id = await startSession(db, student, Number.isFinite(raw) && raw > 0 ? raw : null, new Date(), prep);
  const items = await sessionItemsOf(db, id);
  const first = nextEssential(items) ?? nextOptional(items);
  revalidatePath("/", "layout");
  redirect(first ? practiceHref(first, prep) : routesFor(prep).session);
}

/** Skip a look-back. From the practice page, go on to the next problem; from the session page, stay. */
export async function skipItemAction(formData: FormData): Promise<void> {
  const student = await requireStudent();
  const fallback = routesFor(parsePrep(formData.get("prep"))).session;
  const itemId = String(formData.get("item") ?? "");
  if (!UUID_RE.test(itemId)) redirect(fallback);
  const db = await getDb();
  const item = await skipItem(db, student.id, itemId);
  revalidatePath("/", "layout");
  if (!item) redirect(fallback);
  // The session decides where the student stays: its own preparation's pages.
  const prep = (await ownSession(db, student.id, item.sessionId))?.preparation ?? "exam4";
  if (formData.get("from") === "practice") {
    const next = nextEssential(await sessionItemsOf(db, item.sessionId));
    redirect(next ? practiceHref(next, prep) : routesFor(prep).session);
  }
  redirect(routesFor(prep).session);
}

/** End today's session early; unfinished problems go back to the pool. */
export async function finishSessionAction(formData: FormData): Promise<void> {
  const student = await requireStudent();
  let prep = parsePrep(formData.get("prep"));
  const sessionId = String(formData.get("session") ?? "");
  if (UUID_RE.test(sessionId)) {
    const db = await getDb();
    const row = await ownSession(db, student.id, sessionId);
    if (row) {
      prep = row.preparation;
      await finishSession(db, student.id, sessionId);
      revalidatePath("/", "layout");
    }
  }
  redirect(routesFor(prep).session);
}

/** Keep going: add one of the offered extras to today's session and open it. */
export async function keepGoingAction(formData: FormData): Promise<void> {
  const student = await requireStudent();
  const prep = parsePrep(formData.get("prep"));
  const problemId = String(formData.get("problem") ?? "");
  if (!PROBLEM_ID_RE.test(problemId)) redirect(routesFor(prep).session);
  const db = await getDb();
  const item = await addKeepGoing(db, student, problemId);
  revalidatePath("/", "layout");
  if (!item) redirect(routesFor(prep).session);
  const own = (await ownSession(db, student.id, item.sessionId))?.preparation ?? prep;
  redirect(practiceHref(item, own));
}

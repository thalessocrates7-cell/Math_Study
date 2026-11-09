"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { addKeepGoing, finishSession, nextEssential, nextOptional, practiceHref, sessionItemsOf, skipItem, startSession } from "@/server/sessions";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID_RE = /^[0-9]+\.[0-9]+-[A-Za-z0-9]+$/;

/** Start (or continue) today's session and go straight to its first problem. */
export async function startSessionAction(formData: FormData): Promise<void> {
  const student = await requireStudent();
  const raw = Number(formData.get("minutes"));
  const db = await getDb();
  const id = await startSession(db, student, Number.isFinite(raw) && raw > 0 ? raw : null);
  const items = await sessionItemsOf(db, id);
  const first = nextEssential(items) ?? nextOptional(items);
  revalidatePath("/", "layout");
  redirect(first ? practiceHref(first) : "/session");
}

/** Skip a look-back. From the practice page, go on to the next problem; from the session page, stay. */
export async function skipItemAction(formData: FormData): Promise<void> {
  const student = await requireStudent();
  const itemId = String(formData.get("item") ?? "");
  if (!UUID_RE.test(itemId)) redirect("/session");
  const db = await getDb();
  const item = await skipItem(db, student.id, itemId);
  revalidatePath("/", "layout");
  if (item && formData.get("from") === "practice") {
    const next = nextEssential(await sessionItemsOf(db, item.sessionId));
    redirect(next ? practiceHref(next) : "/session");
  }
  redirect("/session");
}

/** End today's session early; unfinished problems go back to the pool. */
export async function finishSessionAction(formData: FormData): Promise<void> {
  const student = await requireStudent();
  const sessionId = String(formData.get("session") ?? "");
  if (UUID_RE.test(sessionId)) {
    const db = await getDb();
    await finishSession(db, student.id, sessionId);
    revalidatePath("/", "layout");
  }
  redirect("/session");
}

/** Keep going: add one of the offered extras to today's session and open it. */
export async function keepGoingAction(formData: FormData): Promise<void> {
  const student = await requireStudent();
  const problemId = String(formData.get("problem") ?? "");
  if (!ID_RE.test(problemId)) redirect("/session");
  const db = await getDb();
  const item = await addKeepGoing(db, student, problemId);
  revalidatePath("/", "layout");
  redirect(item ? practiceHref(item) : "/session");
}

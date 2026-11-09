/**
 * Study sessions: one sitting with a planned list of problems that fits the student's time (the
 * planning itself is src/lib/session-builder.ts). Viewing a plan never writes anything; a session is
 * saved only when the student presses Start.
 */
import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";
import type { DB, Q } from "../db/client";
import { attempts, type AttemptOrigin, type ItemTrack, sections, sessionItems, type SessionItem, type Student, studySessions } from "../db/schema";
import { dayPlan } from "../lib/availability";
import { extraOptions, planSession } from "../lib/engine";
import { type ReasonLookup, reasonText } from "../lib/reasons";
import type { PlannedItem } from "../lib/session-builder";
import { type Loaded, loadStudentModel, type SessionWithItems } from "./model";

/** "How much time do you have?" choices for a session that isn't in the schedule. */
export const SESSION_LENGTHS = [15, 30, 45, 60] as const;
const MIN_SESSION = 10;
const MAX_SESSION = 180;

/** The attempt origin recorded for each kind of session item. */
export const TRACK_ORIGIN: Record<ItemTrack, AttemptOrigin> = {
  new: "plan",
  challenge: "challenge",
  reinforcement: "review",
  lookback: "lookback",
  extra: "extra",
};

const isOpen = (i: SessionItem) => i.status === "pending" || i.status === "active";

/** Today's session to continue: the latest one that isn't finished. */
export function openSessionOf(today: SessionWithItems[]): SessionWithItems | null {
  const last = today[today.length - 1];
  return last && last.session.status !== "completed" ? last : null;
}

/** The next planned (essential) item still to do, by position. */
export function nextEssential(items: SessionItem[]): SessionItem | null {
  return items.find((i) => i.essential && isOpen(i)) ?? null;
}

/** The next optional item (a bonus Challenge or a Keep going pick) still to do. */
export function nextOptional(items: SessionItem[]): SessionItem | null {
  return items.find((i) => !i.essential && isOpen(i)) ?? null;
}

export function practiceHref(item: Pick<SessionItem, "id" | "problemId">): string {
  return `/practice/${encodeURIComponent(item.problemId)}?s=${item.id}`;
}

export type SessionProgress = {
  /** Planned items done (or skipped) and the planned total; items moved to next time drop out of both. */
  done: number;
  total: number;
  plannedMinutes: number;
  /** On-screen minutes spent on this session's problems so far. */
  spentMinutes: number;
  /** The planned part is finished (optional extras may remain). */
  complete: boolean;
};

const isFinished = (i: SessionItem) => i.status === "done" || i.status === "skipped";

export function sessionProgress(s: SessionWithItems, loaded: Pick<Loaded, "attemptById">): SessionProgress {
  const essential = s.items.filter((i) => i.essential && i.status !== "dropped");
  let seconds = 0;
  for (const i of s.items) {
    const a = i.attemptId ? loaded.attemptById.get(i.attemptId) : undefined;
    if (a) seconds += a.activeSeconds;
  }
  return {
    done: essential.filter(isFinished).length,
    total: essential.length,
    plannedMinutes: essential.reduce((m, i) => m + i.minutes, 0),
    spentMinutes: Math.round(seconds / 60),
    complete: essential.every((i) => !isOpen(i)),
  };
}

export type NextSessionPlan = {
  slot: number;
  minutes: number;
  /** The scheduled length for this slot, or null when today (or this slot) isn't in the schedule. */
  scheduledMinutes: number | null;
  firstOfDay: boolean;
  items: PlannedItem[];
  bonus: PlannedItem | null;
};

/** What the next session today would contain (a preview; nothing is saved). */
export function previewNextSession(loaded: Loaded, minutes?: number | null): NextSessionPlan {
  const slot = loaded.todaySessions.length + 1;
  const plan = dayPlan(loaded.availability, loaded.today);
  const scheduledMinutes = plan && slot <= plan.sessions ? plan.minutes : null;
  const chosen = minutes && Number.isFinite(minutes) ? Math.round(minutes) : (scheduledMinutes ?? 30);
  const length = Math.min(MAX_SESSION, Math.max(MIN_SESSION, chosen));
  const built = planSession(loaded.model, { sessionMinutes: length, firstOfDay: slot === 1 });
  return { slot, minutes: length, scheduledMinutes, firstOfDay: slot === 1, items: built.items, bonus: built.bonus };
}

/**
 * Starts today's next session (or returns the one already open). Safe to call twice: the unique
 * (student, day, slot) index means a double click or a second tab can't create two sessions.
 */
export async function startSession(db: DB, student: Student, minutes?: number | null, now = new Date()): Promise<string> {
  const loaded = await loadStudentModel(db, student, now);
  const open = openSessionOf(loaded.todaySessions);
  if (open) return open.session.id;
  const next = previewNextSession(loaded, minutes);
  const { pacing } = loaded.model.plan;
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(studySessions)
      .values({
        studentId: student.id,
        day: loaded.today,
        slot: next.slot,
        budgetMinutes: next.minutes,
        adHoc: next.scheduledMinutes === null || next.minutes !== next.scheduledMinutes,
        snapshot: { pacing: pacing.status, challengeMode: pacing.challengeMode, unitId: loaded.model.plan.currentUnitId, finalReview: pacing.finalReview },
      })
      .onConflictDoNothing()
      .returning();
    if (!row) {
      const [existing] = await tx
        .select({ id: studySessions.id })
        .from(studySessions)
        .where(and(eq(studySessions.studentId, student.id), eq(studySessions.day, loaded.today), eq(studySessions.slot, next.slot)));
      return existing.id;
    }
    const all = next.bonus ? [...next.items, next.bonus] : next.items;
    if (all.length > 0) {
      await tx.insert(sessionItems).values(
        all.map((it, i) => ({
          sessionId: row.id,
          studentId: student.id,
          position: i + 1,
          track: it.track,
          problemId: it.problemId,
          reviewItemId: it.reviewItemId,
          reason: it.reason,
          minutes: it.minutes,
          essential: it.essential,
        })),
      );
    }
    return row.id;
  });
}

async function ownSession(q: Q, studentId: string, sessionId: string) {
  const [row] = await q
    .select()
    .from(studySessions)
    .where(and(eq(studySessions.id, sessionId), eq(studySessions.studentId, studentId)));
  return row ?? null;
}

/** Pause or resume (the timer itself runs in the browser; this is what the dashboard shows). */
export async function setSessionPaused(q: Q, studentId: string, sessionId: string, paused: boolean): Promise<void> {
  const s = await ownSession(q, studentId, sessionId);
  if (!s || s.status === "completed") return;
  await q
    .update(studySessions)
    .set({ status: paused ? "paused" : "active" })
    .where(eq(studySessions.id, s.id));
}

/** Marks the session finished once nothing planned is left. Returns true if it is (now) complete. */
export async function completeIfDone(q: Q, sessionId: string, now = new Date()): Promise<boolean> {
  const items = await q.select().from(sessionItems).where(eq(sessionItems.sessionId, sessionId));
  if (items.some((i) => i.essential && isOpen(i))) return false;
  await q
    .update(studySessions)
    .set({ status: "completed", endedAt: now })
    .where(and(eq(studySessions.id, sessionId), sql`${studySessions.status} <> 'completed'`));
  return true;
}

/** Ends the session early. Unfinished planned problems go back to the pool for next time. */
export async function finishSession(q: Q, studentId: string, sessionId: string, now = new Date()): Promise<void> {
  const s = await ownSession(q, studentId, sessionId);
  if (!s) return;
  await q
    .update(sessionItems)
    .set({ status: "dropped" })
    .where(and(eq(sessionItems.sessionId, s.id), inArray(sessionItems.status, ["pending", "active"])));
  await q.update(studySessions).set({ status: "completed", endedAt: now }).where(eq(studySessions.id, s.id));
}

/**
 * Skips a look-back (Regressive Study). It stays due and climbs a little in priority, so it comes
 * back another day. Other items aren't skippable: optional ones can simply be left.
 */
export async function skipItem(q: Q, studentId: string, itemId: string, now = new Date()): Promise<SessionItem | null> {
  const [item] = await q
    .select()
    .from(sessionItems)
    .where(and(eq(sessionItems.id, itemId), eq(sessionItems.studentId, studentId)));
  if (!item || item.track !== "lookback" || !isOpen(item)) return null;
  await q.update(sessionItems).set({ status: "skipped", doneAt: now }).where(eq(sessionItems.id, item.id));
  await completeIfDone(q, item.sessionId, now);
  return item;
}

/** Keep going: the optional extras on offer after (or beside) today's plan. */
export function keepGoingFor(loaded: Loaded): PlannedItem[] {
  const taken = new Set<string>();
  for (const s of loaded.todaySessions) for (const i of s.items) taken.add(i.problemId);
  return extraOptions(loaded.model, taken);
}

/**
 * Adds a Keep going pick to today's latest session and returns the new item. The pick must be one
 * of the current options (so a stale or edited form can't add anything else).
 */
export async function addKeepGoing(db: DB, student: Student, problemId: string, now = new Date()): Promise<SessionItem | null> {
  const loaded = await loadStudentModel(db, student, now);
  const latest = loaded.todaySessions[loaded.todaySessions.length - 1];
  if (!latest) return null;
  const already = latest.items.find((i) => i.problemId === problemId && isOpen(i));
  if (already) return already;
  const pick = keepGoingFor(loaded).find((o) => o.problemId === problemId);
  if (!pick) return null;
  const position = latest.items.reduce((m, i) => Math.max(m, i.position), 0) + 1;
  const [row] = await db
    .insert(sessionItems)
    .values({
      sessionId: latest.session.id,
      studentId: student.id,
      position,
      track: pick.track,
      problemId: pick.problemId,
      reviewItemId: pick.reviewItemId,
      reason: pick.reason,
      minutes: pick.minutes,
      essential: false,
    })
    .returning();
  return row;
}

/** Inserts planned items right after `afterPosition`, shifting the later ones down. */
export async function insertItemsAfter(q: Q, session: { id: string; studentId: string }, afterPosition: number, items: PlannedItem[]): Promise<SessionItem[]> {
  if (items.length === 0) return [];
  await q
    .update(sessionItems)
    .set({ position: sql`${sessionItems.position} + ${items.length}` })
    .where(and(eq(sessionItems.sessionId, session.id), gt(sessionItems.position, afterPosition)));
  return q
    .insert(sessionItems)
    .values(
      items.map((it, i) => ({
        sessionId: session.id,
        studentId: session.studentId,
        position: afterPosition + 1 + i,
        track: it.track,
        problemId: it.problemId,
        reviewItemId: it.reviewItemId,
        reason: it.reason,
        minutes: it.minutes,
        essential: it.essential,
      })),
    )
    .returning();
}

/** Items of one session in order. */
export async function sessionItemsOf(q: Q, sessionId: string): Promise<SessionItem[]> {
  return q.select().from(sessionItems).where(eq(sessionItems.sessionId, sessionId)).orderBy(asc(sessionItems.position));
}

export type SessionBar = {
  item: SessionItem;
  sessionId: string;
  paused: boolean;
  completed: boolean;
  /** 1-based place among the planned items (null for an optional extra). */
  index: number | null;
  total: number;
  done: number;
  budgetMinutes: number;
  spentMinutes: number;
  reasonText: string;
};

/** What the practice page shows for a problem opened from today's session. */
export async function sessionBarFor(q: Q, studentId: string, itemId: string, problemId: string): Promise<SessionBar | null> {
  const [item] = await q
    .select()
    .from(sessionItems)
    .where(and(eq(sessionItems.id, itemId), eq(sessionItems.studentId, studentId), eq(sessionItems.problemId, problemId)));
  if (!item) return null;
  const [[session], items, secs] = await Promise.all([
    q.select().from(studySessions).where(eq(studySessions.id, item.sessionId)),
    sessionItemsOf(q, item.sessionId),
    q.select({ id: sections.id, title: sections.title, concepts: sections.concepts }).from(sections),
  ]);
  const ids = items.map((i) => i.attemptId).filter((id): id is string => id !== null);
  const times = ids.length > 0 ? await q.select({ s: attempts.activeSeconds }).from(attempts).where(inArray(attempts.id, ids)) : [];
  const essential = items.filter((i) => i.essential && i.status !== "dropped");
  const byId = new Map(secs.map((s) => [s.id, s]));
  const lookup: ReasonLookup = {
    unitTitle: (id) => byId.get(id)?.title,
    skillLabel: (key) => {
      const [u, s] = key.split(":");
      return byId.get(u)?.concepts.find((c) => c.id === s)?.label;
    },
  };
  const index = item.essential ? essential.findIndex((i) => i.id === item.id) + 1 : null;
  return {
    item,
    sessionId: session.id,
    paused: session.status === "paused",
    completed: session.status === "completed",
    index,
    total: essential.length,
    done: essential.filter(isFinished).length,
    budgetMinutes: session.budgetMinutes,
    spentMinutes: Math.round(times.reduce((m, t) => m + t.s, 0) / 60),
    reasonText: reasonText(item.reason, lookup),
  };
}

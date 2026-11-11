/**
 * Loads everything the adaptive planner needs for one student (a handful of queries) and runs it.
 * Pages and actions call loadStudentModel(); the planning itself is pure (src/lib/engine.ts).
 */
import { and, asc, eq, gte, inArray } from "drizzle-orm";
import type { Difficulty } from "../../content/types";
import type { Q } from "../db/client";
import {
  attempts,
  problems,
  problemTimeStats,
  reviewItems,
  sections,
  sessionItems,
  settings,
  type SessionItem,
  type Student,
  studySessions,
  type StudySession,
} from "../db/schema";
import { type Availability, DEFAULT_AVAILABILITY, parseAvailability } from "../lib/availability";
import { addDays, todayISO } from "../lib/dates";
import { computeModel, type StudentModel } from "../lib/engine";
import type { TimeStats } from "../lib/estimates";
import type { EngineAttempt, EngineProblem, EngineReview, EngineUnit } from "../lib/learning-state";
import { type Prep, type Routes, routesFor } from "../lib/prep";
import type { ReasonLookup } from "../lib/reasons";
import { type Rules, resolveRules } from "../lib/rules";
import { loadChecks } from "./checklist";
import { prepProblemIds } from "./prep";
import { examFor, studentFor } from "./settings";

export type ProblemLite = {
  id: string;
  sectionId: string;
  difficulty: Difficulty;
  concepts: string[];
  active: boolean;
  estMinutes: number | null;
  sort: number;
  openstaxNumber: number | null;
  statement: string;
};

export type SectionLite = typeof sections.$inferSelect;

export type SessionWithItems = { session: StudySession; items: SessionItem[] };

export type Loaded = {
  now: Date;
  today: string;
  student: Student;
  /** Integration Review (exam4) or the Final Exam: everything below is that preparation's only. */
  prep: Prep;
  /** That preparation's pages (e.g. /final-exam/session). */
  routes: Routes;
  examName: string;
  classExamDate: string;
  /** The student's own date if they set one, else the class date. */
  examDate: string;
  /** The exam's start time as 24-hour New York time ("14:00"), when known (the Final Exam). */
  examTime: string | null;
  rules: Rules;
  availability: Availability;
  /** False until the student saves a schedule (the default one is used meanwhile). */
  hasSchedule: boolean;
  sections: SectionLite[];
  sectionById: Map<string, SectionLite>;
  problems: ProblemLite[];
  problemById: Map<string, ProblemLite>;
  /** Today's sessions, oldest first, each with its items in order. */
  todaySessions: SessionWithItems[];
  attemptById: Map<string, EngineAttempt>;
  model: StudentModel;
  lookup: ReasonLookup;
};

export async function loadStudentModel(q: Q, student: Student, now = new Date(), prep: Prep = "exam4"): Promise<Loaded> {
  const today = todayISO(now);
  const recentSince = new Date(now.getTime() - 4 * 86_400_000);
  // Only this preparation's problems, and so only its attempts, reviews, ticks and sessions.
  const mine = prepProblemIds(q, prep);
  const [settingsRows, secs, probs, stats, atts, pending, sessions, recent, ticked] = await Promise.all([
    q.select().from(settings).where(eq(settings.id, 1)),
    q.select().from(sections).where(eq(sections.preparation, prep)).orderBy(asc(sections.sort)),
    q
      .select({
        id: problems.id,
        sectionId: problems.sectionId,
        difficulty: problems.difficulty,
        concepts: problems.concepts,
        active: problems.active,
        estMinutes: problems.estMinutes,
        sort: problems.sort,
        openstaxNumber: problems.openstaxNumber,
        statement: problems.statement,
      })
      .from(problems)
      .where(inArray(problems.id, mine))
      .orderBy(asc(problems.sort)),
    q.select().from(problemTimeStats),
    q
      .select()
      .from(attempts)
      .where(and(eq(attempts.studentId, student.id), inArray(attempts.problemId, mine))),
    q
      .select()
      .from(reviewItems)
      .where(and(eq(reviewItems.studentId, student.id), eq(reviewItems.status, "pending"), inArray(reviewItems.problemId, mine))),
    q
      .select()
      .from(studySessions)
      .where(and(eq(studySessions.studentId, student.id), eq(studySessions.preparation, prep), eq(studySessions.day, today)))
      .orderBy(asc(studySessions.slot)),
    q
      .select()
      .from(sessionItems)
      .where(
        and(
          eq(sessionItems.studentId, student.id),
          gte(sessionItems.createdAt, recentSince),
          inArray(
            sessionItems.sessionId,
            q
              .select({ id: studySessions.id })
              .from(studySessions)
              .where(and(eq(studySessions.studentId, student.id), eq(studySessions.preparation, prep))),
          ),
        ),
      )
      .orderBy(asc(sessionItems.position)),
    loadChecks(q, student.id, prep),
  ]);

  const row = settingsRows[0];
  const rules = resolveRules(row?.rules);
  const exam = examFor(prep, row);
  const own = studentFor(prep, student);
  const classExamDate = exam.classDate;
  const examDate = own.examDateOverride ?? classExamDate;
  const parsed = parseAvailability(own.availability);
  const availability = parsed ?? DEFAULT_AVAILABILITY;

  const units: EngineUnit[] = secs.map((s) => ({ id: s.id, title: s.title, sort: s.sort, kind: s.kind, skills: s.concepts }));
  const engineProblems: EngineProblem[] = probs.map((p) => ({
    id: p.id,
    unitId: p.sectionId,
    difficulty: p.difficulty,
    skills: p.concepts,
    active: p.active,
    estMinutes: p.estMinutes,
    sort: p.sort,
  }));
  const engineAttempts: EngineAttempt[] = atts.map((a) => ({
    id: a.id,
    problemId: a.problemId,
    origin: a.origin,
    openedAt: a.openedAt,
    ratedAt: a.ratedAt,
    ratedDay: a.ratedDay,
    rating: a.rating,
    solutionViewed: a.solutionViewed,
    hintsShown: a.hintsShown,
    answerRevealed: a.answerRevealed,
    activeSeconds: a.activeSeconds,
    sessionItemId: a.sessionItemId,
  }));
  const reviews: EngineReview[] = pending.map((r) => ({
    id: r.id,
    problemId: r.problemId,
    sourceProblemId: r.sourceProblemId,
    dueDate: r.dueDate,
    reason: r.reason,
    createdAt: r.createdAt,
  }));
  const timeStats = new Map<string, TimeStats>(stats.map((s) => [s.problemId, { n: s.n, sumLogSeconds: s.sumLogSeconds }]));

  const sessionIds = new Set(sessions.map((s) => s.id));
  const todaySessions: SessionWithItems[] = sessions.map((s) => ({ session: s, items: recent.filter((i) => i.sessionId === s.id) }));
  const problemUnit = new Map(probs.map((p) => [p.id, p.sectionId]));
  const skippedToday = new Set<string>();
  const skippedRecent = new Map<string, number>();
  const threeDaysAgo = addDays(today, -3);
  for (const i of recent) {
    if (i.track !== "lookback" || i.status !== "skipped") continue;
    const unit = problemUnit.get(i.problemId);
    if (!unit) continue;
    if (sessionIds.has(i.sessionId)) skippedToday.add(unit);
    if (todayISO(i.createdAt) >= threeDaysAgo) skippedRecent.set(unit, (skippedRecent.get(unit) ?? 0) + 1);
  }
  const minutesUsedToday = atts.filter((a) => todayISO(a.openedAt) === today).reduce((m, a) => m + a.activeSeconds, 0) / 60;

  const model = computeModel({
    today,
    examDate,
    availability,
    units,
    problems: engineProblems,
    attempts: engineAttempts,
    reviews,
    timeStats,
    rules,
    seed: student.id,
    // The supplementary sections (4.1, 4.2) are Integration Review's; the Final Exam has none.
    includeSupplementary: prep === "exam4" && student.supplementaryOptIn,
    ticked,
    minutesUsedToday,
    challengeDoneToday: sessions.length > 0,
    skippedToday,
    skippedRecent,
  });

  const sectionById = new Map(secs.map((s) => [s.id, s]));
  const lookup: ReasonLookup = {
    unitTitle: (id) => sectionById.get(id)?.title,
    skillLabel: (key) => {
      const [u, s] = key.split(":");
      return sectionById.get(u)?.concepts.find((c) => c.id === s)?.label;
    },
  };
  return {
    now,
    today,
    student,
    prep,
    routes: routesFor(prep),
    examName: exam.name,
    classExamDate,
    examDate,
    examTime: exam.time,
    rules,
    availability,
    hasSchedule: parsed !== null,
    sections: secs,
    sectionById,
    problems: probs,
    problemById: new Map(probs.map((p) => [p.id, p])),
    todaySessions,
    attemptById: new Map(engineAttempts.map((a) => [a.id, a])),
    model,
    lookup,
  };
}

/** Session items for a set of session ids (used by pages that show an earlier session). */
export async function itemsForSessions(q: Q, ids: string[]): Promise<SessionItem[]> {
  if (ids.length === 0) return [];
  return q.select().from(sessionItems).where(inArray(sessionItems.sessionId, ids)).orderBy(asc(sessionItems.position));
}

import { and, asc, count, desc, eq, gte, ilike, inArray, isNotNull, or, sql } from "drizzle-orm";
import type { Check, Difficulty, PlotSpec, Step } from "../../content/types";
import type { DB, Q } from "../db/client";
import {
  adminLoginAttempts,
  assignments,
  attempts,
  notes,
  planConfig,
  problemChecks,
  problems,
  reviewItems,
  sections,
  students,
  type Problem,
  type Student,
} from "../db/schema";
import { addDays } from "../lib/dates";
import { summarize } from "../lib/mastery";
import { ensureAssignments, getPools, rebalanceAllStudents, savePlanConfigs, studentsWithProblems, type PlanCounts } from "./plan";

// ---------------------------------------------------------------- login rate limit

export const LOGIN_WINDOW_MINUTES = 15;
export const LOGIN_MAX_FAILURES = 5;

/** Rows of one kind from one network since a time, oldest first. */
async function recentRows(q: Q, ipHash: string, kind: "admin" | "student", since: Date): Promise<Date[]> {
  const rows = await q
    .select({ at: adminLoginAttempts.at })
    .from(adminLoginAttempts)
    .where(and(eq(adminLoginAttempts.ipHash, ipHash), eq(adminLoginAttempts.kind, kind), gte(adminLoginAttempts.at, since)))
    .orderBy(asc(adminLoginAttempts.at));
  return rows.map((r) => r.at);
}

async function pruneOldRows(q: Q): Promise<void> {
  // Keep the table small.
  await q.delete(adminLoginAttempts).where(sql`${adminLoginAttempts.at} < now() - interval '1 day'`);
}

export async function recentLoginFailures(q: Q, ipHash: string, now = new Date()): Promise<{ count: number; retryAt: Date | null }> {
  const rows = await recentRows(q, ipHash, "admin", new Date(now.getTime() - LOGIN_WINDOW_MINUTES * 60_000));
  const retryAt = rows.length >= LOGIN_MAX_FAILURES ? new Date(rows[0].getTime() + LOGIN_WINDOW_MINUTES * 60_000) : null;
  return { count: rows.length, retryAt };
}

export async function recordLoginFailure(q: Q, ipHash: string): Promise<void> {
  await q.insert(adminLoginAttempts).values({ ipHash, kind: "admin" });
  await pruneOldRows(q);
}

export async function clearLoginFailures(q: Q, ipHash: string): Promise<void> {
  await q.delete(adminLoginAttempts).where(and(eq(adminLoginAttempts.ipHash, ipHash), eq(adminLoginAttempts.kind, "admin")));
}

/**
 * Student sign-in can't fail (any name opens or creates an account), so every sign-in counts. The
 * limit is generous because a whole class on campus Wi-Fi shares one network address.
 */
export const STUDENT_SIGNIN_WINDOW_MINUTES = 10;
export const STUDENT_SIGNIN_MAX = 60;

export async function studentSignInRetryAt(q: Q, ipHash: string, now = new Date()): Promise<Date | null> {
  const rows = await recentRows(q, ipHash, "student", new Date(now.getTime() - STUDENT_SIGNIN_WINDOW_MINUTES * 60_000));
  if (rows.length < STUDENT_SIGNIN_MAX) return null;
  return new Date(rows[rows.length - STUDENT_SIGNIN_MAX].getTime() + STUDENT_SIGNIN_WINDOW_MINUTES * 60_000);
}

export async function recordStudentSignIn(q: Q, ipHash: string): Promise<void> {
  await q.insert(adminLoginAttempts).values({ ipHash, kind: "student" });
  await pruneOldRows(q);
}

// ---------------------------------------------------------------- class overview

export type StudentRow = {
  student: Student;
  assigned: number;
  done: number;
  progress: number;
  toReview: number;
  dueNow: number;
  lastActive: Date;
};

export async function studentRows(q: Q, today: string, search?: string): Promise<StudentRow[]> {
  const term = search?.trim();
  const roster = await q
    .select()
    .from(students)
    .where(term ? or(ilike(students.firstName, `%${term}%`), ilike(students.lastName, `%${term}%`)) : undefined)
    .orderBy(asc(students.lastName), asc(students.firstName));
  if (roster.length === 0) return [];
  const ids = roster.map((s) => s.id);
  const [asg, rated, pending] = await Promise.all([
    q
      .select({ studentId: assignments.studentId, problemId: assignments.problemId })
      .from(assignments)
      .innerJoin(problems, eq(problems.id, assignments.problemId))
      .where(and(inArray(assignments.studentId, ids), eq(problems.active, true))),
    q
      .select({ studentId: attempts.studentId, problemId: attempts.problemId, rating: attempts.rating, ratedDay: attempts.ratedDay, ratedAt: attempts.ratedAt })
      .from(attempts)
      .where(and(inArray(attempts.studentId, ids), isNotNull(attempts.ratedAt))),
    q
      .select({ studentId: reviewItems.studentId, dueDate: reviewItems.dueDate })
      .from(reviewItems)
      .where(and(inArray(reviewItems.studentId, ids), eq(reviewItems.status, "pending"))),
  ]);
  return roster.map((student) => {
    const mine = asg.filter((a) => a.studentId === student.id);
    const sums = summarize(
      rated
        .filter((r) => r.studentId === student.id)
        .map((r) => ({ problemId: r.problemId, rating: r.rating!, ratedDay: r.ratedDay!, ratedAt: r.ratedAt! })),
    );
    const done = mine.filter((a) => sums.has(a.problemId)).length;
    let toReview = 0;
    for (const s of sums.values()) if (s.latest === "shaky" || s.latest === "lost") toReview++;
    const lastRated = [...sums.values()].reduce<Date | null>((m, s) => (s.latestAt && (!m || s.latestAt > m) ? s.latestAt : m), null);
    return {
      student,
      assigned: mine.length,
      done,
      progress: mine.length ? Math.round((done / mine.length) * 100) : 0,
      toReview,
      dueNow: pending.filter((p) => p.studentId === student.id && p.dueDate <= today).length,
      lastActive: lastRated && lastRated > student.lastSeenAt ? lastRated : student.lastSeenAt,
    };
  });
}

export type ClassOverview = {
  totalStudents: number;
  activeThisWeek: number;
  avgProgress: number;
  avgCompleted: number;
  needReview: number;
  bySection: Array<{ sectionId: string; title: string; got_it: number; shaky: number; lost: number }>;
  mostMissed: Array<{ sectionId: string; title: string; lost: number }>;
  recent: Array<{ studentId: string; name: string; problemId: string; sectionId: string; openstaxNumber: number | null; difficulty: Difficulty; rating: string; ratedAt: Date }>;
  rows: StudentRow[];
};

export async function classOverview(q: Q, today: string, now = new Date()): Promise<ClassOverview> {
  const rows = await studentRows(q, today);
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const [secs, latestBySection, recent] = await Promise.all([
    // The class overview is Integration Review's (the Final Exam's chapters have their own preparation).
    q
      .select({ id: sections.id, title: sections.title })
      .from(sections)
      .where(and(eq(sections.kind, "core"), eq(sections.preparation, "exam4")))
      .orderBy(asc(sections.sort)),
    // Latest rating per (student, problem), counted by section.
    q.execute(sql`
      select p.section_id as "sectionId", latest.rating as "rating", count(*)::int as "n"
      from (
        select distinct on (a.student_id, a.problem_id) a.student_id, a.problem_id, a.rating
        from attempts a
        where a.rated_at is not null
        order by a.student_id, a.problem_id, a.rated_at desc
      ) latest
      join problems p on p.id = latest.problem_id
      group by p.section_id, latest.rating`),
    q
      .select({
        studentId: attempts.studentId,
        first: students.firstName,
        last: students.lastName,
        problemId: attempts.problemId,
        sectionId: problems.sectionId,
        openstaxNumber: problems.openstaxNumber,
        difficulty: problems.difficulty,
        rating: attempts.rating,
        ratedAt: attempts.ratedAt,
      })
      .from(attempts)
      .innerJoin(students, eq(students.id, attempts.studentId))
      .innerJoin(problems, eq(problems.id, attempts.problemId))
      .where(isNotNull(attempts.ratedAt))
      .orderBy(desc(attempts.ratedAt))
      .limit(10),
  ]);
  const counts = (latestBySection.rows as Array<{ sectionId: string; rating: string; n: number }>) ?? [];
  const bySection = secs.map((s) => {
    const get = (r: string) => counts.find((c) => c.sectionId === s.id && c.rating === r)?.n ?? 0;
    return { sectionId: s.id, title: s.title, got_it: get("got_it"), shaky: get("shaky"), lost: get("lost") };
  });
  return {
    totalStudents: rows.length,
    activeThisWeek: rows.filter((r) => r.lastActive >= weekAgo).length,
    avgProgress: rows.length ? Math.round(rows.reduce((m, r) => m + r.progress, 0) / rows.length) : 0,
    avgCompleted: rows.length ? Math.round(rows.reduce((m, r) => m + r.done, 0) / rows.length) : 0,
    needReview: rows.filter((r) => r.dueNow > 0 || r.toReview > 0).length,
    bySection,
    mostMissed: bySection
      .filter((b) => b.lost > 0)
      .sort((a, b) => b.lost - a.lost)
      .slice(0, 3)
      .map((b) => ({ sectionId: b.sectionId, title: b.title, lost: b.lost })),
    recent: recent.map((r) => ({
      studentId: r.studentId,
      name: `${r.first} ${r.last}`,
      problemId: r.problemId,
      sectionId: r.sectionId,
      openstaxNumber: r.openstaxNumber,
      difficulty: r.difficulty,
      rating: r.rating!,
      ratedAt: r.ratedAt!,
    })),
    rows,
  };
}

// ---------------------------------------------------------------- student detail

export type StudentDetail = {
  student: Student;
  completed: number;
  ratingPercents: { got_it: number; shaky: number; lost: number };
  history: Array<{
    id: string;
    problemId: string;
    sectionId: string;
    openstaxNumber: number | null;
    difficulty: Difficulty;
    origin: string;
    openedAt: Date;
    ratedAt: Date | null;
    rating: string | null;
    hintUsed: boolean;
    answerRevealed: boolean;
    solutionViewed: boolean;
  }>;
  queue: Array<{ id: string; problemId: string; sectionId: string; dueDate: string; reason: string }>;
  noteCount: number;
};

export async function studentDetail(q: Q, id: string): Promise<StudentDetail | null> {
  const [student] = await q.select().from(students).where(eq(students.id, id));
  if (!student) return null;
  const [history, queue, [noteCount]] = await Promise.all([
    q
      .select({
        id: attempts.id,
        problemId: attempts.problemId,
        sectionId: problems.sectionId,
        openstaxNumber: problems.openstaxNumber,
        difficulty: problems.difficulty,
        origin: attempts.origin,
        openedAt: attempts.openedAt,
        ratedAt: attempts.ratedAt,
        rating: attempts.rating,
        hintUsed: attempts.hintUsed,
        answerRevealed: attempts.answerRevealed,
        solutionViewed: attempts.solutionViewed,
        ratedDay: attempts.ratedDay,
      })
      .from(attempts)
      .innerJoin(problems, eq(problems.id, attempts.problemId))
      .where(eq(attempts.studentId, id))
      .orderBy(desc(attempts.openedAt))
      .limit(500),
    q
      .select({ id: reviewItems.id, problemId: reviewItems.problemId, sectionId: problems.sectionId, dueDate: reviewItems.dueDate, reason: reviewItems.reason })
      .from(reviewItems)
      .innerJoin(problems, eq(problems.id, reviewItems.problemId))
      .where(and(eq(reviewItems.studentId, id), eq(reviewItems.status, "pending")))
      .orderBy(asc(reviewItems.dueDate)),
    q.select({ n: count() }).from(notes).where(eq(notes.studentId, id)),
  ]);
  const sums = summarize(
    history
      .filter((h) => h.ratedAt && h.rating)
      .map((h) => ({ problemId: h.problemId, rating: h.rating!, ratedDay: h.ratedDay!, ratedAt: h.ratedAt! })),
  );
  const tally = { got_it: 0, shaky: 0, lost: 0 };
  for (const s of sums.values()) if (s.latest === "got_it" || s.latest === "shaky" || s.latest === "lost") tally[s.latest]++;
  const total = tally.got_it + tally.shaky + tally.lost;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  return {
    student,
    completed: sums.size,
    ratingPercents: { got_it: pct(tally.got_it), shaky: pct(tally.shaky), lost: pct(tally.lost) },
    history: history.map(({ ratedDay: _ratedDay, ...h }) => h),
    queue,
    noteCount: noteCount?.n ?? 0,
  };
}

// ---------------------------------------------------------------- problem bank

export type ProblemListRow = Pick<Problem, "id" | "sectionId" | "openstaxNumber" | "difficulty" | "statement" | "active" | "editedByAdmin" | "concepts">;

export async function listProblems(
  q: Q,
  filter: { section?: string; difficulty?: Difficulty; search?: string; includeInactive?: boolean },
): Promise<ProblemListRow[]> {
  const conds = [];
  if (filter.section) conds.push(eq(problems.sectionId, filter.section));
  if (filter.difficulty) conds.push(eq(problems.difficulty, filter.difficulty));
  if (!filter.includeInactive) conds.push(eq(problems.active, true));
  const term = filter.search?.trim();
  if (term) conds.push(or(ilike(problems.statement, `%${term}%`), ilike(problems.id, `%${term}%`))!);
  return q
    .select({
      id: problems.id,
      sectionId: problems.sectionId,
      openstaxNumber: problems.openstaxNumber,
      difficulty: problems.difficulty,
      statement: problems.statement,
      active: problems.active,
      editedByAdmin: problems.editedByAdmin,
      concepts: problems.concepts,
    })
    .from(problems)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(problems.sectionId), asc(problems.sort));
}

export type ProblemInput = {
  id: string;
  sectionId: string;
  openstaxNumber: number | null;
  difficulty: Difficulty;
  concepts: string[];
  statement: string;
  hints: string[];
  answer: string;
  steps: Step[];
  active: boolean;
  figure?: PlotSpec | null;
  check?: Check | Check[] | null;
};

export function validateProblemInput(input: ProblemInput, knownSections: string[]): string | null {
  if (!/^[0-9]+\.[0-9]+-[A-Za-z0-9]+$/.test(input.id)) return "ID must look like 5.2-80 or 5.4-o4 (section, a dash, then a number or code).";
  if (!knownSections.includes(input.sectionId)) return "Choose a section.";
  if (!input.id.startsWith(`${input.sectionId}-`)) return `ID must start with "${input.sectionId}-".`;
  if (!["F", "C", "Ch"].includes(input.difficulty)) return "Choose a difficulty.";
  if (input.statement.trim().length < 3) return "The problem statement is required.";
  if (input.answer.trim().length < 1) return "The answer is required.";
  if (input.hints.length < 1) return "Add at least one hint.";
  if (input.steps.length < 1) return "Add at least one solution step.";
  if (input.steps.some((s) => !s.title.trim() || !s.body.trim())) return "Every solution step needs a title and a body.";
  return null;
}

export async function saveProblem(db: DB, input: ProblemInput, mode: "create" | "update"): Promise<void> {
  const values = {
    sectionId: input.sectionId,
    openstaxNumber: input.openstaxNumber,
    difficulty: input.difficulty,
    concepts: input.concepts,
    statement: input.statement,
    hints: input.hints,
    answer: input.answer,
    steps: input.steps,
    active: input.active,
    editedByAdmin: true,
    updatedAt: new Date(),
  };
  if (mode === "create") {
    await db.insert(problems).values({
      id: input.id,
      ...values,
      figure: input.figure ?? null,
      check: input.check ?? null,
      sort: input.openstaxNumber ?? 20_000,
    });
  } else {
    await db.update(problems).set(values).where(eq(problems.id, input.id));
  }
  if (!input.active) await refreshPlansWithout(db, [input.id]);
}

/** Deletes a problem; if students have worked it, it is deactivated instead so their history stays. */
export async function deleteProblem(db: DB, id: string): Promise<"deleted" | "deactivated"> {
  const [used] = await db.select({ n: count() }).from(attempts).where(eq(attempts.problemId, id));
  const [queued] = await db.select({ n: count() }).from(reviewItems).where(or(eq(reviewItems.problemId, id), eq(reviewItems.sourceProblemId, id)));
  if ((used?.n ?? 0) > 0 || (queued?.n ?? 0) > 0) {
    await db.update(problems).set({ active: false, editedByAdmin: true, updatedAt: new Date() }).where(eq(problems.id, id));
    await refreshPlansWithout(db, [id]);
    return "deactivated";
  }
  const [row] = await db.select({ sectionId: problems.sectionId }).from(problems).where(eq(problems.id, id));
  const affected = await studentsWithProblems(db, [id]);
  await db.delete(assignments).where(eq(assignments.problemId, id));
  await db.delete(notes).where(eq(notes.problemId, id));
  await db.delete(problemChecks).where(eq(problemChecks.problemId, id));
  await db.delete(problems).where(eq(problems.id, id));
  // Students who had it now have a gap in that section; refill it from the remaining pool.
  if (row && affected.length > 0) await rebalanceAllStudents(db, [row.sectionId], affected);
  return "deleted";
}

async function refreshPlansWithout(db: DB, problemIds: string[]) {
  const affected = await studentsWithProblems(db, problemIds);
  for (const studentId of affected) await ensureAssignments(db, studentId);
}

// ---------------------------------------------------------------- study plan builder

export type PlanRow = { sectionId: string; title: string; counts: PlanCounts; pool: Record<Difficulty, number> };

/**
 * The legacy fixed plan covers only the Exam 4 sections: the empty 4.1/4.2 shells (and the Final
 * Exam's chapters, which have no fixed plan) could never pass validatePlan.
 */
export async function planRows(q: Q): Promise<PlanRow[]> {
  const [secs, configs, pools] = await Promise.all([
    q
      .select({ id: sections.id, title: sections.title })
      .from(sections)
      .where(and(eq(sections.kind, "core"), eq(sections.preparation, "exam4")))
      .orderBy(asc(sections.sort)),
    q.select().from(planConfig),
    getPools(q),
  ]);
  return secs.map((s) => {
    const c = configs.find((x) => x.sectionId === s.id);
    const pool: Record<Difficulty, number> = { F: 0, C: 0, Ch: 0 };
    for (const p of pools.get(s.id) ?? []) pool[p.difficulty]++;
    return {
      sectionId: s.id,
      title: s.title,
      counts: { foundation: c?.foundation ?? 0, core: c?.core ?? 0, challenge: c?.challenge ?? 0 },
      pool,
    };
  });
}

export function validatePlan(rows: Array<{ sectionId: string } & PlanCounts>, current: PlanRow[]): string | null {
  for (const r of rows) {
    const known = current.find((c) => c.sectionId === r.sectionId);
    if (!known) return `Unknown section ${r.sectionId}.`;
    for (const [k, d] of [["foundation", "F"], ["core", "C"], ["challenge", "Ch"]] as const) {
      const v = r[k];
      if (!Number.isInteger(v) || v < 0) return `${known.title}: counts must be whole numbers, 0 or more.`;
      if (v > known.pool[d]) return `${known.title}: only ${known.pool[d]} ${k} problems are available.`;
    }
    if (r.foundation + r.core + r.challenge < 1) return `${known.title}: assign at least one problem.`;
  }
  return null;
}

export async function applyPlan(db: DB, rows: Array<{ sectionId: string } & PlanCounts>, updateExisting: boolean): Promise<number> {
  await savePlanConfigs(db, rows);
  if (!updateExisting) return 0;
  return rebalanceAllStudents(db, rows.map((r) => r.sectionId));
}

// ---------------------------------------------------------------- export

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = value instanceof Date ? value.toISOString() : String(value);
  // Neutralize spreadsheet formulas, then quote.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function attemptsCsv(q: Q): Promise<string> {
  const rows = await q
    .select({
      first: students.firstName,
      last: students.lastName,
      studentId: students.id,
      problemId: attempts.problemId,
      section: problems.sectionId,
      openstax: problems.openstaxNumber,
      difficulty: problems.difficulty,
      origin: attempts.origin,
      openedAt: attempts.openedAt,
      ratedAt: attempts.ratedAt,
      rating: attempts.rating,
      hintUsed: attempts.hintUsed,
      answerRevealed: attempts.answerRevealed,
      solutionViewed: attempts.solutionViewed,
      nextReview: attempts.nextReviewDate,
    })
    .from(attempts)
    .innerJoin(students, eq(students.id, attempts.studentId))
    .innerJoin(problems, eq(problems.id, attempts.problemId))
    .orderBy(asc(students.lastName), asc(students.firstName), asc(attempts.openedAt));
  const header = ["first_name", "last_name", "student_id", "problem_id", "section", "openstax_exercise", "difficulty", "origin", "opened_at", "rated_at", "rating", "hint_used", "answer_revealed", "solution_viewed", "next_review"];
  const lines = rows.map((r) =>
    [r.first, r.last, r.studentId, r.problemId, r.section, r.openstax, r.difficulty, r.origin, r.openedAt, r.ratedAt, r.rating, r.hintUsed, r.answerRevealed, r.solutionViewed, r.nextReview]
      .map(csvCell)
      .join(","),
  );
  return [header.join(","), ...lines].join("\r\n") + "\r\n";
}

export function retentionCutoff(today: string, days: number): string {
  return addDays(today, -days);
}

import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import type { Difficulty } from "../../content/types";
import type { Q } from "../db/client";
import { assignments, attempts, planConfig, problems } from "../db/schema";
import { seededShuffle } from "../lib/random";

export type PlanCounts = { foundation: number; core: number; challenge: number };
export type PlanProblem = { id: string; difficulty: Difficulty; concepts: string[]; sort: number };

const KEY: Record<Difficulty, keyof PlanCounts> = { F: "foundation", C: "core", Ch: "challenge" };
const ORDER: Difficulty[] = ["F", "C", "Ch"];

/**
 * Chooses a student's problems for one section: `counts` per difficulty from the active pool.
 * Problems the student already rated are always kept; other current picks are kept while they fit;
 * any gap is filled from a per-student shuffle (so classmates get different subsets). The result is
 * ordered Foundation, Core, Challenge, and by OpenStax number within each level.
 */
export function computeAssignment(opts: {
  studentId: string;
  sectionId: string;
  counts: PlanCounts;
  pool: PlanProblem[];
  current: string[];
  rated: ReadonlySet<string>;
}): string[] {
  const { studentId, sectionId, counts, pool, current, rated } = opts;
  const byId = new Map(pool.map((p) => [p.id, p]));
  const out: PlanProblem[] = [];
  for (const d of ORDER) {
    const target = Math.max(0, counts[KEY[d]]);
    const mine = current.map((id) => byId.get(id)).filter((p): p is PlanProblem => !!p && p.difficulty === d);
    const chosen = mine.filter((p) => rated.has(p.id));
    for (const p of mine) if (!rated.has(p.id) && chosen.length < target) chosen.push(p);
    if (chosen.length < target) {
      const taken = new Set(chosen.map((p) => p.id));
      const rest = seededShuffle(
        pool.filter((p) => p.difficulty === d && !taken.has(p.id)),
        `${studentId}:${sectionId}:${d}`,
      ).sort((a, b) => Number(rated.has(a.id)) - Number(rated.has(b.id)));
      for (const p of rest) {
        if (chosen.length >= target) break;
        chosen.push(p);
      }
    }
    chosen.sort((a, b) => a.sort - b.sort);
    out.push(...chosen);
  }
  return out.map((p) => p.id);
}

export async function getPlanConfigs(q: Q): Promise<Map<string, PlanCounts>> {
  const rows = await q.select().from(planConfig);
  return new Map(rows.map((r) => [r.sectionId, { foundation: r.foundation, core: r.core, challenge: r.challenge }]));
}

/** Active problems grouped by section. */
export async function getPools(q: Q): Promise<Map<string, PlanProblem[]>> {
  const rows = await q
    .select({ id: problems.id, sectionId: problems.sectionId, difficulty: problems.difficulty, concepts: problems.concepts, sort: problems.sort })
    .from(problems)
    .where(eq(problems.active, true))
    .orderBy(asc(problems.sort));
  const out = new Map<string, PlanProblem[]>();
  for (const r of rows) {
    const list = out.get(r.sectionId) ?? [];
    list.push({ id: r.id, difficulty: r.difficulty, concepts: r.concepts, sort: r.sort });
    out.set(r.sectionId, list);
  }
  return out;
}

export async function ratedProblemIds(q: Q, studentId: string): Promise<Set<string>> {
  const rows = await q
    .selectDistinct({ problemId: attempts.problemId })
    .from(attempts)
    .where(and(eq(attempts.studentId, studentId), isNotNull(attempts.ratedAt)));
  return new Set(rows.map((r) => r.problemId));
}

async function writeAssignment(q: Q, studentId: string, sectionId: string, ids: string[]) {
  await q.delete(assignments).where(and(eq(assignments.studentId, studentId), eq(assignments.sectionId, sectionId)));
  if (ids.length === 0) return;
  await q
    .insert(assignments)
    .values(ids.map((problemId, i) => ({ studentId, problemId, sectionId, position: i + 1 })))
    .onConflictDoNothing();
}

/**
 * Makes sure the student has a plan for every section. Sections with no assignment, or with a
 * problem an admin has since deactivated, are (re)built. Cheap when nothing needs doing.
 */
export async function ensureAssignments(q: Q, studentId: string): Promise<void> {
  const [rows, secs] = await Promise.all([
    q
      .select({ sectionId: assignments.sectionId, problemId: assignments.problemId, active: problems.active })
      .from(assignments)
      .innerJoin(problems, eq(problems.id, assignments.problemId))
      .where(eq(assignments.studentId, studentId)),
    // Only sections with plan counts (Exam 4 sections) get a fixed plan; supplementary ones never do.
    q.select({ id: planConfig.sectionId }).from(planConfig),
  ]);
  const bySection = new Map<string, { problemId: string; active: boolean }[]>();
  for (const r of rows) {
    const list = bySection.get(r.sectionId) ?? [];
    list.push(r);
    bySection.set(r.sectionId, list);
  }
  const needs = secs.filter((s) => {
    const list = bySection.get(s.id);
    return !list || list.length === 0 || list.some((r) => !r.active);
  });
  if (needs.length === 0) return;
  const [configs, pools, rated] = await Promise.all([getPlanConfigs(q), getPools(q), ratedProblemIds(q, studentId)]);
  for (const s of needs) {
    const counts = configs.get(s.id);
    if (!counts) continue;
    const ids = computeAssignment({
      studentId,
      sectionId: s.id,
      counts,
      pool: pools.get(s.id) ?? [],
      current: (bySection.get(s.id) ?? []).map((r) => r.problemId),
      rated,
    });
    await writeAssignment(q, studentId, s.id, ids);
  }
}

/**
 * Re-applies the plan counts (keeps everything students already worked). Limit it to some sections
 * and/or some students; by default every student with a plan is rebalanced.
 */
export async function rebalanceAllStudents(q: Q, sectionIds?: string[], onlyStudents?: string[]): Promise<number> {
  const [configs, pools, all] = await Promise.all([
    getPlanConfigs(q),
    getPools(q),
    q.select({ studentId: assignments.studentId, sectionId: assignments.sectionId, problemId: assignments.problemId }).from(assignments),
  ]);
  const studentIds = onlyStudents ?? [...new Set(all.map((r) => r.studentId))];
  const targetSections = sectionIds ?? [...configs.keys()];
  for (const studentId of studentIds) {
    const rated = await ratedProblemIds(q, studentId);
    for (const sectionId of targetSections) {
      const counts = configs.get(sectionId);
      if (!counts) continue;
      const current = all.filter((r) => r.studentId === studentId && r.sectionId === sectionId).map((r) => r.problemId);
      const ids = computeAssignment({ studentId, sectionId, counts, pool: pools.get(sectionId) ?? [], current, rated });
      await writeAssignment(q, studentId, sectionId, ids);
    }
  }
  return studentIds.length;
}

export async function savePlanConfigs(q: Q, rows: Array<{ sectionId: string } & PlanCounts>): Promise<void> {
  for (const r of rows) {
    await q
      .update(planConfig)
      .set({ foundation: r.foundation, core: r.core, challenge: r.challenge, updatedAt: new Date() })
      .where(eq(planConfig.sectionId, r.sectionId));
  }
}

/** Students whose plan contains any of these problems (used after an admin deactivates one). */
export async function studentsWithProblems(q: Q, problemIds: string[]): Promise<string[]> {
  if (problemIds.length === 0) return [];
  const rows = await q
    .selectDistinct({ studentId: assignments.studentId })
    .from(assignments)
    .where(inArray(assignments.problemId, problemIds));
  return rows.map((r) => r.studentId);
}

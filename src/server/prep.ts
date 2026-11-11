/**
 * Database side of the two preparations (src/lib/prep.ts). A problem's preparation is its section's,
 * so these helpers scope attempts, reviews and ticks without a column of their own that could disagree.
 */
import { eq } from "drizzle-orm";
import type { Q } from "../db/client";
import { problems, sections } from "../db/schema";
import type { Prep } from "../lib/prep";

/** Subquery: the ids of every problem (active or not) in one preparation's sections. */
export function prepProblemIds(q: Q, prep: Prep) {
  return q
    .select({ id: problems.id })
    .from(problems)
    .innerJoin(sections, eq(sections.id, problems.sectionId))
    .where(eq(sections.preparation, prep));
}

/** The preparation a problem belongs to, or null for an unknown problem. */
export async function prepOfProblem(q: Q, problemId: string): Promise<Prep | null> {
  const [row] = await q
    .select({ prep: sections.preparation })
    .from(problems)
    .innerJoin(sections, eq(sections.id, problems.sectionId))
    .where(eq(problems.id, problemId));
  return row?.prep ?? null;
}

/** The preparation a section belongs to, or null for an unknown section. */
export async function prepOfSection(q: Q, sectionId: string): Promise<Prep | null> {
  const [row] = await q.select({ prep: sections.preparation }).from(sections).where(eq(sections.id, sectionId));
  return row?.prep ?? null;
}

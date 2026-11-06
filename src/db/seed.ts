import { sql } from "drizzle-orm";
import {
  ALL_PROBLEMS,
  DEFAULT_EXAM,
  DEFAULT_PLAN,
  SECTIONS,
  SMALL_PLAN,
  type Difficulty,
  type ProblemSeed,
} from "../../content/index";
import type { DB } from "./client";
import * as s from "./schema";

type Counts = Record<Difficulty, number>;

/** The default F/C/Ch counts for a section with the given pool sizes. */
export function defaultPlanFor(pool: Counts) {
  const fits = (p: { foundation: number; core: number; challenge: number }) =>
    pool.F >= p.foundation && pool.C >= p.core && pool.Ch >= p.challenge;
  if (fits(DEFAULT_PLAN)) return { ...DEFAULT_PLAN };
  return {
    foundation: Math.min(SMALL_PLAN.foundation, pool.F),
    core: Math.min(SMALL_PLAN.core, pool.C),
    challenge: Math.min(SMALL_PLAN.challenge, pool.Ch),
  };
}

function toRow(p: ProblemSeed): typeof s.problems.$inferInsert {
  return {
    id: p.id,
    sectionId: p.section,
    openstaxNumber: p.openstax,
    difficulty: p.difficulty,
    concepts: p.concepts,
    statement: p.statement,
    figure: p.figure ?? null,
    hints: p.hints,
    answer: p.answer,
    steps: p.steps,
    check: p.check,
    sort: p.sort,
  };
}

/**
 * Idempotent seed: upserts sections, inserts any problems that are missing, and creates default plan
 * and settings rows. With force, also refreshes problems from content/ unless an admin edited them.
 */
export async function seedDatabase(db: DB, opts: { force?: boolean } = {}): Promise<{ inserted: number }> {
  for (const sec of SECTIONS) {
    await db
      .insert(s.sections)
      .values({ id: sec.id, title: sec.title, objectives: sec.objectives, concepts: sec.concepts, sort: sec.sort, url: sec.url })
      .onConflictDoUpdate({
        target: s.sections.id,
        set: { title: sec.title, objectives: sec.objectives, concepts: sec.concepts, sort: sec.sort, url: sec.url },
      });
  }

  const rows = ALL_PROBLEMS.map(toRow);
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    if (opts.force) {
      const res = await db
        .insert(s.problems)
        .values(chunk)
        .onConflictDoUpdate({
          target: s.problems.id,
          set: {
            sectionId: sql`excluded.section_id`,
            openstaxNumber: sql`excluded.openstax_number`,
            difficulty: sql`excluded.difficulty`,
            concepts: sql`excluded.concepts`,
            statement: sql`excluded.statement`,
            figure: sql`excluded.figure`,
            hints: sql`excluded.hints`,
            answer: sql`excluded.answer`,
            steps: sql`excluded.steps`,
            check: sql`excluded.check`,
            sort: sql`excluded.sort`,
            updatedAt: sql`now()`,
          },
          setWhere: sql`${s.problems.editedByAdmin} = false`,
        })
        .returning({ id: s.problems.id });
      inserted += res.length;
    } else {
      const res = await db.insert(s.problems).values(chunk).onConflictDoNothing().returning({ id: s.problems.id });
      inserted += res.length;
    }
  }

  for (const sec of SECTIONS) {
    const pool: Counts = { F: 0, C: 0, Ch: 0 };
    for (const p of ALL_PROBLEMS) if (p.section === sec.id) pool[p.difficulty]++;
    await db.insert(s.planConfig).values({ sectionId: sec.id, ...defaultPlanFor(pool) }).onConflictDoNothing();
  }

  await db.insert(s.settings).values({ id: 1, examName: DEFAULT_EXAM.name, examDate: DEFAULT_EXAM.date }).onConflictDoNothing();
  return { inserted };
}

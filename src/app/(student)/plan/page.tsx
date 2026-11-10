import type { Metadata } from "next";
import { problemLabel } from "@/components/Badges";
import { PageTransition } from "@/components/PageTransition";
import { StudyPlanView, type PlanProblem } from "@/components/plan/StudyPlanView";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { defaultSection, parseLevel } from "@/lib/checklist";
import { loadChecks } from "@/server/checklist";
import { loadStudentModel } from "@/server/model";

export const metadata: Metadata = { title: "Study Plan" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PlanPage({ searchParams }: Props) {
  const student = await requireStudent();
  const sp = await searchParams;
  const db = await getDb();
  const [loaded, checked] = await Promise.all([loadStudentModel(db, student), loadChecks(db, student.id)]);

  const withProblems = new Set(loaded.problems.filter((p) => p.active).map((p) => p.sectionId));
  // Exam 4 sections, plus the extra ones only for students who opted in, and only once they have problems.
  const sections = loaded.sections
    .filter((s) => withProblems.has(s.id) && (s.kind === "core" || student.supplementaryOptIn))
    .map((s) => ({ id: s.id, title: s.title, objective: s.objectives[0] ?? "" }));
  const planProblems: PlanProblem[] = loaded.problems
    .filter((p) => p.active)
    .map((p) => ({
      id: p.id,
      sectionId: p.sectionId,
      difficulty: p.difficulty,
      sort: p.sort,
      active: p.active,
      label: problemLabel(p.openstaxNumber, p.id),
      rating: (() => {
        const r = loaded.model.state.problems.get(p.id)?.latest;
        return r === "got_it" || r === "shaky" || r === "lost" ? r : null;
      })(),
    }));

  const wanted = typeof sp.section === "string" ? sp.section : null;
  const ids = sections.map((s) => s.id);
  const initialSection = wanted && ids.includes(wanted) ? wanted : defaultSection(ids, loaded.model.plan.currentUnitId);
  const initialLevel = parseLevel(sp.level) ?? parseLevel(sp.d) ?? "core";

  return (
    <PageTransition>
      <div className="page">
        <header className="page-header">
          <div>
            <h1>Study Plan</h1>
            <p className="lede">Your organized roadmap for {loaded.examName}, in study order.</p>
          </div>
        </header>
        {initialSection ? (
          <StudyPlanView sections={sections} problems={planProblems} checked={[...checked]} initialSection={initialSection} initialLevel={initialLevel} />
        ) : (
          <p className="small text-2">No problems are available yet.</p>
        )}
      </div>
    </PageTransition>
  );
}

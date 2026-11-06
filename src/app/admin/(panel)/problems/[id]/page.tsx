import { Trash } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SECTIONS } from "@content/index";
import { deleteProblemAction } from "@/app/actions/admin";
import { ProblemEditor, type EditorProblem } from "@/components/admin/ProblemEditor";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { FunctionPlot } from "@/components/FunctionPlot";
import { getDb } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { getProblem } from "@/server/practice";
import { PageTransition } from "@/components/PageTransition";

export const metadata: Metadata = { title: "Admin · Edit problem" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditProblemPage({ params, searchParams }: Props) {
  await requireAdmin();
  const { id: raw } = await params;
  const sp = await searchParams;
  const id = decodeURIComponent(raw);
  const sections = SECTIONS.map((s) => ({ id: s.id, title: s.title, concepts: s.concepts }));
  const db = await getDb();

  let mode: "create" | "update" = "update";
  let initial: EditorProblem;
  let figure: React.ReactNode = null;
  if (id === "new") {
    mode = "create";
    initial = {
      id: "4.10-o1",
      sectionId: "4.10",
      openstaxNumber: null,
      difficulty: "C",
      concepts: [],
      statement: "",
      hints: [""],
      answer: "",
      steps: [
        { title: "", body: "" },
        { title: "", body: "" },
      ],
      active: true,
    };
  } else {
    const p = await getProblem(db, id);
    if (!p) notFound();
    initial = {
      id: p.id,
      sectionId: p.sectionId,
      openstaxNumber: p.openstaxNumber,
      difficulty: p.difficulty,
      concepts: p.concepts,
      statement: p.statement,
      hints: p.hints,
      answer: p.answer,
      steps: p.steps,
      active: p.active,
    };
    figure = p.figure ? <FunctionPlot spec={p.figure} /> : null;
  }

  return (
    <PageTransition>
      <div className="page" style={{ maxWidth: 1280 }}>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href="/admin/problems">Problem Bank</Link>
            </li>
            <li aria-current="page">{mode === "create" ? "New problem" : id}</li>
          </ol>
        </nav>
        <header className="page-header">
          <div>
            <h1>{mode === "create" ? "Add a problem" : `Edit ${id}`}</h1>
            <p className="lede">
              {mode === "create"
                ? "New problems join the pool for their section; adjust the Study Plan counts to assign them."
                : "Changes show up for students right away. Answers to edited problems are not re-checked automatically."}
            </p>
          </div>
        </header>
        {sp.saved === "1" ? (
          <div className="alert alert-success" role="status" style={{ marginBottom: 16 }}>
            Saved.
          </div>
        ) : null}
        {sp.retired === "1" ? (
          <div className="alert alert-info" role="status" style={{ marginBottom: 16 }}>
            Students have worked this problem, so it was retired instead of deleted. Their history is kept and it no longer appears in plans.
          </div>
        ) : null}
        {figure ? (
          <section className="card" style={{ marginBottom: 16 }} aria-label="Figure">
            <p className="small text-2">This problem has a figure (edit it in the content files):</p>
            {figure}
          </section>
        ) : null}
        <ProblemEditor key={id} mode={mode} initial={initial} sections={sections} />
        {mode === "update" ? (
          <section className="card section-gap" aria-labelledby="delete-problem-title">
            <h2 id="delete-problem-title" className="card-title">
              Delete problem
            </h2>
            <p className="small text-2" style={{ marginBottom: 12 }}>
              If any student has worked this problem it is retired instead, so their history stays intact.
            </p>
            <form action={deleteProblemAction}>
              <input type="hidden" name="id" value={id} />
              <ConfirmSubmit
                label={
                  <>
                    <Trash size={16} aria-hidden="true" />
                    Delete problem
                  </>
                }
                title={`Delete ${id}?`}
                body="The problem will be removed from every study plan. Students who already worked it keep their history."
                confirmLabel="Delete"
              />
            </form>
          </section>
        ) : null}
      </div>
    </PageTransition>
  );
}

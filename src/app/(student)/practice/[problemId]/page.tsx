import { CircleX, TriangleExclamationPoint } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DIFFICULTIES, DIFFICULTY_BLURB, DIFFICULTY_LABEL } from "@content/types";
import { DifficultyBadge, problemLabel } from "@/components/Badges";
import { FunctionPlot } from "@/components/FunctionPlot";
import { Workspace } from "@/components/practice/Workspace";
import { ProgressBar } from "@/components/Progress";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { renderRich } from "@/lib/tex";
import { workspaceData } from "@/server/practice";
import { PageTransition } from "@/components/PageTransition";

type Props = {
  params: Promise<{ problemId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = { title: "Practice" };

const REASON: Record<string, string> = {
  shaky: "Review: you marked this one Shaky",
  lost: "Review: you marked this one Lost",
  got_it: "Retention check: you got this one before",
  similar: "Similar problem for extra practice",
  easier: "Easier problem on the same idea",
};

export default async function PracticePage({ params, searchParams }: Props) {
  const student = await requireStudent();
  const { problemId: raw } = await params;
  const sp = await searchParams;
  const problemId = decodeURIComponent(raw);
  const itemId = typeof sp.item === "string" ? sp.item : null;
  const db = await getDb();
  const data = await workspaceData(db, student.id, problemId, itemId);
  if (!data) notFound();

  const { problem, section } = data;
  const pct = data.total ? Math.round((data.done / data.total) * 100) : 0;
  const tag = data.position
    ? `Problem ${data.position} · ${problemLabel(problem.openstaxNumber, problem.id)}`
    : `Extra practice · ${problemLabel(problem.openstaxNumber, problem.id)}`;

  const asideTop = (
    <>
      <section className="card side-card" aria-labelledby="section-info-title">
        <h2 id="section-info-title">Section Info</h2>
        <p className="small" style={{ fontWeight: 600 }}>
          {section.id} – {section.title}
        </p>
        <p className="small text-2" style={{ marginTop: 8 }}>
          <span style={{ fontWeight: 600, color: "var(--text)" }}>Learning objective: </span>
          {section.objectives[Math.min(section.objectives.length - 1, 0)]}
        </p>
        {problem.concepts.length ? (
          <p className="xsmall muted" style={{ marginTop: 8 }}>
            Skills: {problem.concepts.map((c) => section.concepts.find((x) => x.id === c)?.label ?? c).join(", ")}
          </p>
        ) : null}
      </section>
      <section className="card side-card" aria-labelledby="levels-title">
        <h2 id="levels-title">Difficulty Levels</h2>
        <ul className="legend-list">
          {DIFFICULTIES.map((d) => (
            <li key={d}>
              <DifficultyBadge d={d} short decorative />
              <span>
                <strong>{DIFFICULTY_LABEL[d]}</strong> <span className="muted">– {DIFFICULTY_BLURB[d]}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );

  const asideBottom =
    data.recentWeak.length > 0 ? (
      <section className="card side-card" aria-labelledby="recent-review-title">
        <h2 id="recent-review-title">Recent Review in This Section</h2>
        <ul className="list">
          {data.recentWeak.map((w) => (
            <li key={w.problemId}>
              <Link className="row-link small" href={`/practice/${encodeURIComponent(w.problemId)}`}>
                {w.rating === "lost" ? (
                  <CircleX size={16} aria-hidden="true" style={{ color: "var(--danger-icon)" }} />
                ) : (
                  <TriangleExclamationPoint size={16} aria-hidden="true" style={{ color: "var(--warning-icon)" }} />
                )}
                <span className="row-main">
                  <span>{problemLabel(w.openstaxNumber, w.problemId)}</span>
                  <span className="row-sub">Last rated {w.rating === "lost" ? "Lost" : "Shaky"}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    ) : null;

  return (
    <PageTransition>
      <div className="page">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href={data.reviewItem ? "/review" : "/plan"}>{data.reviewItem ? "Review Queue" : "Study Plan"}</Link>
            </li>
            <li>
              <Link href={`/plan/${section.id}`}>{`${section.id} ${section.title}`}</Link>
            </li>
            <li aria-current="page">Practice</li>
          </ol>
        </nav>
        <header className="page-header" style={{ marginBottom: 12 }}>
          <div>
            <h1>
              {section.id} – {section.title}
            </h1>
            {data.reviewItem ? <p className="lede">{REASON[data.reviewItem.reason]}</p> : null}
          </div>
          <DifficultyBadge d={problem.difficulty} />
        </header>
        {data.position ? (
          <div className="ws-progress">
            <div className="spread small">
              <span style={{ fontWeight: 600 }}>
                Question {data.position} of {data.total}
              </span>
              <span className="text-2 num">{pct}% complete</span>
            </div>
            <ProgressBar value={data.done} max={data.total} label={`Section ${section.id} progress`} />
          </div>
        ) : null}
        {!problem.active ? (
          <div className="alert alert-warning" style={{ marginBottom: 16 }}>
            This problem was retired by your instructor. You can still finish this review.
          </div>
        ) : null}

        <Workspace
          key={`${problem.id}:${itemId ?? ""}`}
          problemId={problem.id}
          itemId={data.reviewItem?.id ?? null}
          tag={tag}
          statementHtml={renderRich(problem.statement)}
          figure={problem.figure ? <FunctionPlot spec={problem.figure} /> : null}
          hintsHtml={problem.hints.map((h) => renderRich(h))}
          answerHtml={renderRich(problem.answer)}
          steps={problem.steps.map((s) => ({ title: s.title, html: renderRich(s.body) }))}
          note={data.note}
          asideTop={asideTop}
          asideBottom={asideBottom}
        />
        <p className="xsmall muted" style={{ marginTop: 24 }}>
          {problem.openstaxNumber
            ? `Adapted from OpenStax Calculus Volume 1, Section ${section.id}, Exercise ${problem.openstaxNumber} (CC BY-NC-SA 4.0).`
            : `Original practice problem in the style of OpenStax Calculus Volume 1, Section ${section.id}.`}
        </p>
      </div>
    </PageTransition>
  );
}

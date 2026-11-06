import { ArrowRight, Check, PartyPopper } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DIFFICULTIES, DIFFICULTY_LABEL, type Difficulty } from "@content/types";
import { DifficultyBadge, problemLabel, StatusLabel } from "@/components/Badges";
import { Preview } from "@/components/Rich";
import { ProgressRing } from "@/components/Progress";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { loadStudentState, sectionDetail, sectionProgress } from "@/server/progress";
import { PageTransition } from "@/components/PageTransition";

type Props = {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  return { title: `Section ${decodeURIComponent(section)}` };
}

const FILTERS: Array<{ key: "all" | Difficulty; label: string }> = [
  { key: "all", label: "All" },
  ...DIFFICULTIES.map((d) => ({ key: d, label: DIFFICULTY_LABEL[d] })),
];

export default async function SectionPage({ params, searchParams }: Props) {
  const student = await requireStudent();
  const { section: raw } = await params;
  const sp = await searchParams;
  const sectionId = decodeURIComponent(raw);
  const db = await getDb();
  const state = await loadStudentState(db, student.id);
  const detail = sectionDetail(state, sectionId);
  if (!detail) notFound();

  const { progress } = detail;
  const filter = (typeof sp.d === "string" && ["F", "C", "Ch"].includes(sp.d) ? sp.d : "all") as "all" | Difficulty;
  const shown = filter === "all" ? detail.problems : detail.problems.filter((p) => p.difficulty === filter);
  const complete = sp.complete === "1" && !progress.nextProblemId;
  const all = sectionProgress(state);
  const nextSection = all.find((p) => p.nextProblemId && p.section.id !== sectionId);
  const next = progress.nextProblemId;

  return (
    <PageTransition>
      <div className="page">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href="/plan">Study Plan</Link>
            </li>
            <li aria-current="page">
              {progress.section.id} {progress.section.title}
            </li>
          </ol>
        </nav>
        <header className="page-header">
          <div>
            <h1>
              {progress.section.id} – {progress.section.title}
            </h1>
            <p className="lede">{progress.section.objectives[0]}</p>
          </div>
          {next ? (
            <Link className="btn btn-primary" href={`/practice/${encodeURIComponent(next)}`}>
              {progress.done === 0 ? "Start Practice" : "Continue Practice"}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          ) : null}
        </header>

        {complete ? (
          <div className="alert alert-success" role="status" style={{ marginBottom: 16 }}>
            <PartyPopper size={18} aria-hidden="true" />
            <div className="stack-sm">
              <p>
                <strong>Section complete.</strong> You rated all {progress.total} problems in {progress.section.id}. Anything you marked Shaky or
                Lost is waiting in your review queue.
              </p>
              {nextSection ? (
                <p>
                  <Link href={`/practice/${encodeURIComponent(nextSection.nextProblemId!)}`}>
                    Start {nextSection.section.id} {nextSection.section.title}
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="grid grid-2">
          <section className="card" aria-labelledby="obj-title">
            <h2 id="obj-title" className="card-title">
              Learning Objectives
            </h2>
            <ul className="objectives">
              {progress.section.objectives.map((o) => (
                <li key={o}>
                  <Check size={16} aria-hidden="true" />
                  <span className="small">{o}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="card" aria-labelledby="sec-progress-title">
            <h2 id="sec-progress-title" className="card-title">
              Progress
            </h2>
            <div className="cluster" style={{ gap: 20 }}>
              <ProgressRing value={progress.done} max={progress.total} label={`${progress.section.id} progress`} size={72} />
              <dl className="kv" style={{ flex: 1, minWidth: 180 }}>
                <dt>Problems completed</dt>
                <dd className="num">
                  {progress.done} of {progress.total}
                </dd>
                <dt>Got it</dt>
                <dd className="num">{progress.ratings.got_it}</dd>
                <dt>Shaky</dt>
                <dd className="num">{progress.ratings.shaky}</dd>
                <dt>Lost</dt>
                <dd className="num">{progress.ratings.lost}</dd>
                <dt>Mastered</dt>
                <dd className="num">{progress.ratings.mastered}</dd>
              </dl>
            </div>
          </section>
        </div>

        <section className="card section-gap" aria-labelledby="problems-title">
          <div className="card-head">
            <h2 id="problems-title" className="card-title">
              Problems
            </h2>
            <span className="xsmall muted">Status shows your latest rating. Mastered = Got it on two different days.</span>
          </div>
          <nav aria-label="Filter by difficulty">
            <div className="tabs">
              {FILTERS.map((f) => (
                <Link
                  key={f.key}
                  href={f.key === "all" ? `/plan/${sectionId}` : `/plan/${sectionId}?d=${f.key}`}
                  aria-current={filter === f.key ? "page" : undefined}
                  transitionTypes={["same-page"]}
                >
                  {f.label}
                </Link>
              ))}
            </div>
          </nav>
          <ul className="list">
            {shown.map((p) => (
              <li key={p.problemId} className="problem-row">
                <span className="problem-index" aria-hidden="true">
                  {p.index}
                </span>
                <div className="stack-sm" style={{ gap: 2, minWidth: 0 }}>
                  <span className="small" style={{ fontWeight: 650 }}>
                    Problem {p.index} <span className="muted">· {problemLabel(p.openstaxNumber, p.problemId)}</span>
                  </span>
                  <Preview src={p.statement} />
                </div>
                <div className="problem-meta">
                  <span>
                    <DifficultyBadge d={p.difficulty} />
                  </span>
                  <span>
                    <StatusLabel status={p.status} />
                  </span>
                  <Link className={p.status === "new" ? "btn btn-secondary btn-sm" : "btn btn-ghost btn-sm"} href={`/practice/${encodeURIComponent(p.problemId)}`}>
                    {p.status === "new" ? "Start" : "Practice again"}
                    <span className="sr-only"> problem {p.index}</span>
                  </Link>
                </div>
              </li>
            ))}
            {shown.length === 0 ? <li className="small text-2" style={{ padding: "12px 0" }}>No {filter} problems in your plan for this section.</li> : null}
          </ul>
          {detail.extras.length > 0 ? (
            <div className="section-gap">
              <h3 className="small" style={{ marginBottom: 8 }}>
                Extra practice from your review queue
              </h3>
              <ul className="cluster" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {detail.extras.map((x) => (
                  <li key={x.problemId}>
                    <Link className="pill pill-neutral" href={`/practice/${encodeURIComponent(x.problemId)}`}>
                      {problemLabel(x.openstaxNumber, x.problemId)} · <StatusLabel status={x.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>
    </PageTransition>
  );
}

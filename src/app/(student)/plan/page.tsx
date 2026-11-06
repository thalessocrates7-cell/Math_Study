import { ArrowRight, BadgeCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DIFFICULTY_BLURB, DIFFICULTY_LABEL, DIFFICULTIES } from "@content/types";
import { DifficultyBadge } from "@/components/Badges";
import { ProgressBar } from "@/components/Progress";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { loadStudentState, sectionProgress } from "@/server/progress";
import { getSettings } from "@/server/settings";
import { PageTransition } from "@/components/PageTransition";

export const metadata: Metadata = { title: "Study Plan" };

export default async function PlanPage() {
  const student = await requireStudent();
  const db = await getDb();
  const [state, settings] = await Promise.all([loadStudentState(db, student.id), getSettings(db)]);
  const progress = sectionProgress(state);

  return (
    <PageTransition>
      <div className="page">
        <header className="page-header">
          <div>
            <h1>Study Plan</h1>
            <p className="lede">Your organized roadmap for {settings.examName}, in study order.</p>
          </div>
        </header>

        <section className="card" aria-labelledby="legend-title" style={{ marginBottom: 16 }}>
          <h2 id="legend-title" className="sr-only">
            Difficulty levels
          </h2>
          <ul className="cluster" style={{ listStyle: "none", margin: 0, padding: 0, gap: "8px 20px" }}>
            {DIFFICULTIES.map((d) => (
              <li key={d} className="cluster small text-2">
                <DifficultyBadge d={d} />
                <span>{DIFFICULTY_BLURB[d]}</span>
              </li>
            ))}
          </ul>
        </section>

        <ol className="plan-list">
          {progress.map((p) => {
            const label = p.done === 0 ? "Start" : p.nextProblemId ? "Continue" : "Review";
            const href = p.nextProblemId ? `/practice/${encodeURIComponent(p.nextProblemId)}` : `/plan/${p.section.id}`;
            return (
              <li key={p.section.id} className="card plan-card">
                <div className="stack-sm">
                  <div className="cluster">
                    <h2>
                      <Link href={`/plan/${p.section.id}`}>
                        {p.section.id} – {p.section.title}
                      </Link>
                    </h2>
                    {p.mastered ? (
                      <span className="pill pill-success">
                        <BadgeCheck size={13} aria-hidden="true" />
                        Mastered
                      </span>
                    ) : null}
                  </div>
                  <p className="small text-2">{p.section.objectives[0]}</p>
                  <p className="xsmall muted">
                    {p.total} problems: {DIFFICULTIES.map((d) => `${p.counts[d]} ${DIFFICULTY_LABEL[d]}`).join(" · ")}
                  </p>
                </div>
                <div className="stack-sm">
                  <div className="spread small">
                    <span className="text-2 num">
                      {p.done}/{p.total} done
                    </span>
                    <span className="num">{p.percent}%</span>
                  </div>
                  <ProgressBar value={p.done} max={p.total} label={`${p.section.id} progress`} />
                </div>
                <Link className={p.done === 0 && p.section.id === progress.find((x) => x.nextProblemId)?.section.id ? "btn btn-primary" : "btn btn-secondary"} href={href}>
                  {label}
                  <span className="sr-only"> section {p.section.id}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </PageTransition>
  );
}

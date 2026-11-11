import { ArrowRight, Brain, CircleCheck, Gauge, Lightbulb } from "lucide-react";
import Link from "next/link";
import { ActivityColumns, RatingDonut, SectionBars } from "@/components/charts";
import { PageTransition } from "@/components/PageTransition";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { planHref } from "@/lib/checklist";
import { todayISO } from "@/lib/dates";
import type { Prep } from "@/lib/prep";
import { loadStudentState, progressReport, sectionProgress } from "@/server/progress";
import { getExam } from "@/server/settings";

/** My Progress of either environment (/progress or /final-exam/progress), from its own ratings only. */
export async function ProgressView({ prep }: { prep: Prep }) {
  const student = await requireStudent();
  const db = await getDb();
  const today = todayISO();
  const [state, exam] = await Promise.all([loadStudentState(db, student.id, prep), getExam(db, prep)]);
  const sections = sectionProgress(state);
  const report = progressReport(state, today);
  const final = prep === "final";
  const unit = final ? "chapter" : "section";

  return (
    <PageTransition>
      <div className="page">
        <header className="page-header">
          <div>
            <h1>My Progress</h1>
            <p className="lede">{final ? `Your understanding across the ${exam.name} chapters.` : `Your understanding across the ${exam.name} topics.`}</p>
          </div>
        </header>

        <div className="grid grid-4 stat-grid">
          <div className="card stat">
            <span className="stat-icon tone-accent" aria-hidden="true">
              <Brain size={20} />
            </span>
            <div>
              <div className="stat-value">{report.attempted}</div>
              <div className="stat-label">Problems attempted</div>
            </div>
          </div>
          <div className="card stat">
            <span className="stat-icon tone-success" aria-hidden="true">
              <CircleCheck size={20} />
            </span>
            <div>
              <div className="stat-value">{report.gotItPercent}%</div>
              <div className="stat-label">Got it (self-reported)</div>
            </div>
          </div>
          <div className="card stat">
            <span className="stat-icon tone-warning" aria-hidden="true">
              <Gauge size={20} />
            </span>
            <div>
              <div className="stat-value">{report.confidence ?? "–"}</div>
              <div className="stat-label">Average confidence (of 3)</div>
            </div>
          </div>
          <div className="card stat">
            <span className="stat-icon tone-accent" aria-hidden="true">
              <Lightbulb size={20} />
            </span>
            <div>
              <div className="stat-value">{report.helpPercent}%</div>
              <div className="stat-label">Attempts with help</div>
            </div>
          </div>
        </div>

        <section className="card section-gap" aria-labelledby="by-section-title">
          <h2 id="by-section-title" className="card-title">
            {final ? "Chapter performance" : "Section performance"}
          </h2>
          <p className="small text-2" style={{ marginBottom: 16 }}>
            Each bar is one {unit} of your plan, split by your latest rating of each problem.
          </p>
          <SectionBars
            caption={`Latest ratings by ${unit}`}
            rows={sections.map((p) => ({
              id: p.section.id,
              label: `${p.section.id} ${p.section.title}`,
              href: planHref(p.section.id, "core", prep),
              got: p.ratings.got_it,
              shaky: p.ratings.shaky,
              lost: p.ratings.lost,
              new: p.ratings.new,
            }))}
          />
        </section>

        <div className="grid grid-2 section-gap">
          <section className="card" aria-labelledby="confidence-title">
            <h2 id="confidence-title" className="card-title">
              Confidence ratings
            </h2>
            <RatingDonut got={report.latest.got_it} shaky={report.latest.shaky} lost={report.latest.lost} />
          </section>
          <section className="card" aria-labelledby="weak-title">
            <h2 id="weak-title" className="card-title">
              {final ? "Weakest chapters" : "Weakest sections"}
            </h2>
            {report.weakest.length === 0 ? (
              <p className="small text-2">
                No weak spots yet. {final ? "Chapters" : "Sections"} with Shaky or Lost problems will show up here.
              </p>
            ) : (
              <ul className="list">
                {report.weakest.map((w) => (
                  <li key={w.section.id}>
                    <Link className="row-link" href={planHref(w.section.id, "core", prep)}>
                      <span className="row-main">
                        <span className="row-title small">
                          {w.section.id} – {w.section.title}
                        </span>
                        <span className="row-sub">
                          {w.lost} Lost · {w.shaky} Shaky
                        </span>
                      </span>
                      <ArrowRight className="chev" size={16} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="card section-gap" aria-labelledby="activity-title">
          <h2 id="activity-title" className="card-title">
            Activity, last 14 days
          </h2>
          <ActivityColumns data={report.activity} />
        </section>
      </div>
    </PageTransition>
  );
}

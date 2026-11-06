import { ArrowRight, Brain, CircleCheck, Gauge, Lightbulb } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ActivityColumns, RatingDonut, SectionBars } from "@/components/charts";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { todayISO } from "@/lib/dates";
import { loadStudentState, progressReport, sectionProgress } from "@/server/progress";
import { getSettings } from "@/server/settings";

export const metadata: Metadata = { title: "My Progress" };

export default async function ProgressPage() {
  const student = await requireStudent();
  const db = await getDb();
  const today = todayISO();
  const [state, settings] = await Promise.all([loadStudentState(db, student.id), getSettings(db)]);
  const sections = sectionProgress(state);
  const report = progressReport(state, today);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>My Progress</h1>
          <p className="lede">Your understanding across the {settings.examName} topics.</p>
        </div>
      </header>

      <div className="grid grid-4">
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
          Section performance
        </h2>
        <p className="small text-2" style={{ marginBottom: 16 }}>
          Each bar is one section of your plan, split by your latest rating of each problem.
        </p>
        <SectionBars
          caption="Latest ratings by section"
          rows={sections.map((p) => ({
            id: p.section.id,
            label: `${p.section.id} ${p.section.title}`,
            href: `/plan/${p.section.id}`,
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
            Weakest sections
          </h2>
          {report.weakest.length === 0 ? (
            <p className="small text-2">No weak spots yet. Sections with Shaky or Lost problems will show up here.</p>
          ) : (
            <ul className="list">
              {report.weakest.map((w) => (
                <li key={w.section.id}>
                  <Link className="row-link" href={`/plan/${w.section.id}`}>
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
  );
}

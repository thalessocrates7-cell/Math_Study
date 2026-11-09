import { ArrowRight, BadgeCheck, CalendarDays, ChevronRight, CircleCheck, RotateCcw, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { problemLabel, RatingPill } from "@/components/Badges";
import { ProgressBar } from "@/components/Progress";
import { TodayCard } from "@/components/session/TodayCard";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { formatFullDate, formatLongDate, greeting } from "@/lib/dates";
import { loadStudentModel } from "@/server/model";
import { dashboardStats, examCountdown, loadStudentState, sectionProgress } from "@/server/progress";
import { PageTransition } from "@/components/PageTransition";

export const metadata: Metadata = { title: "Dashboard" };

function countdownText(days: number): string {
  if (days > 1) return `${days} days remaining`;
  if (days === 1) return "Tomorrow";
  if (days === 0) return "Today";
  return "Exam date passed";
}

export default async function DashboardPage() {
  const student = await requireStudent();
  // First visit since the adaptive planner: set up a study schedule first.
  if (!student.onboardedAt) redirect("/schedule?setup=1");
  const db = await getDb();
  const [state, loaded] = await Promise.all([loadStudentState(db, student.id), loadStudentModel(db, student)]);
  const today = loaded.today;
  const settings = { examName: loaded.examName, examDate: loaded.examDate };
  const stats = dashboardStats(state, today);
  const progress = sectionProgress(state);
  const days = examCountdown(settings.examDate, today);
  const sectionTitle = (id: string) => state.sections.find((s) => s.id === id)?.title ?? id;
  const recent = state.rated.slice(0, 5);
  const totalPlanned = progress.reduce((m, p) => m + p.total, 0);

  return (
    <PageTransition>
      <div className="page">
        <header className="page-header">
          <div>
            <p className="eyebrow">{formatLongDate(today)}</p>
            <h1>
              {greeting()}, {student.firstName}.
            </h1>
            <p className="lede">Your {settings.examName} preparation at a glance.</p>
          </div>
        </header>

        <div className="dash-top">
          <section className="card exam-card" aria-labelledby="exam-title">
            <div className="stat">
              <span className="stat-icon tone-accent" aria-hidden="true">
                <CalendarDays size={20} />
              </span>
              <div>
                <h2 id="exam-title" style={{ fontSize: "var(--text-md)" }}>
                  {settings.examName}
                </h2>
                <p className="small text-2">{formatFullDate(settings.examDate)}</p>
              </div>
            </div>
            <div className="exam-days">
              {days > 1 ? (
                <>
                  <strong className="num">{days}</strong>
                  <span className="small text-2">days remaining</span>
                </>
              ) : (
                <span className="pill pill-accent">{countdownText(days)}</span>
              )}
            </div>
          </section>

          <div className="stat-strip">
            <Link className="stat-tile" href="/progress">
              <span className="stat-icon tone-success" aria-hidden="true">
                <CircleCheck size={20} />
              </span>
              <span className="stat-value">{stats.completed}</span>
              <span className="stat-label">Completed</span>
            </Link>
            <Link className="stat-tile" href="/progress">
              <span className="stat-icon tone-accent" aria-hidden="true">
                <Trophy size={20} />
              </span>
              <span className="stat-value">{stats.sectionsMastered}</span>
              <span className="stat-label">Sections mastered</span>
            </Link>
            <Link className="stat-tile" href="/review">
              <span className="stat-icon tone-warning" aria-hidden="true">
                <RotateCcw size={20} />
              </span>
              <span className="stat-value">{stats.toReview}</span>
              <span className="stat-label">To review</span>
            </Link>
          </div>
        </div>

        {stats.dueNow > 0 ? (
          <div className="due-banner">
            <p>
              You have <strong className="num">{stats.dueNow}</strong> review question{stats.dueNow === 1 ? "" : "s"} due today.
            </p>
            <Link className="btn btn-secondary btn-sm" href="/review">
              Go to Review Queue
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        ) : null}

        <div className="dash-main">
          <TodayCard loaded={loaded} />

          <section className="card" aria-labelledby="recent-title">
            <h2 id="recent-title" className="card-title">
              Recent Activity
            </h2>
            {recent.length === 0 ? (
              <p className="small text-2">No activity yet. Problems you rate will show up here.</p>
            ) : (
              <ul className="list">
                {recent.map((r) => (
                  <li key={r.attemptId}>
                    <Link className="row-link" href={`/practice/${encodeURIComponent(r.problemId)}`}>
                      <span className="row-main">
                        <span className="row-title small">
                          {r.sectionId} {sectionTitle(r.sectionId)}
                        </span>
                        <span className="row-sub">{problemLabel(r.openstaxNumber, r.problemId)}</span>
                      </span>
                      <RatingPill rating={r.rating} />
                      <ChevronRight className="chev" size={18} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="card section-gap" aria-labelledby="plan-progress-title">
          <div className="card-head">
            <h2 id="plan-progress-title" className="card-title">
              Study Plan Progress
            </h2>
            <Link className="card-link" href="/plan">
              View all <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <p className="small text-2" style={{ marginBottom: 16 }}>
            {stats.completed} of {totalPlanned} planned problems rated. Problems you rate Got it come back later to check that they stuck.
          </p>
          <ul className="list">
            {progress.map((p) => (
              <li key={p.section.id} style={{ padding: "12px 0" }}>
                <div className="progress-row">
                  <Link href={`/plan/${p.section.id}`} className="small" style={{ fontWeight: 600, color: "var(--text)", textDecoration: "none" }}>
                    {p.mastered ? (
                      <>
                        <BadgeCheck size={16} aria-hidden="true" style={{ display: "inline", verticalAlign: "-3px", marginRight: 6, color: "var(--success-icon)" }} />
                        <span className="sr-only">Mastered: </span>
                      </>
                    ) : null}
                    {p.section.id} {p.section.title}
                  </Link>
                  <ProgressBar value={p.done} max={p.total} label={`${p.section.id} ${p.section.title}`} />
                  <span className="small num" style={{ textAlign: "right" }}>
                    {p.percent}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageTransition>
  );
}

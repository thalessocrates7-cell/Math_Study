import { ArrowRight, BadgeCheck, CalendarDays, ChevronRight, CircleCheck, RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";
import { FINAL_POOL } from "@content/index";
import { problemLabel, RatingPill } from "@/components/Badges";
import { PageTransition } from "@/components/PageTransition";
import { ProgressBar } from "@/components/Progress";
import { StudyCard } from "@/components/session/StudyCard";
import { BackToIntegration } from "@/components/views/BackToIntegration";
import { CoverageCard } from "@/components/views/CoverageCard";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { defaultSection, planHref } from "@/lib/checklist";
import { computeCoverage } from "@/lib/coverage";
import { clockHHMM, formatFullDate, formatLongDate, greeting } from "@/lib/dates";
import { countdownLabel, countdownTo, formatExamTime, practiceLink, type Prep } from "@/lib/prep";
import { loadChecks } from "@/server/checklist";
import { loadStudentModel } from "@/server/model";
import { dashboardStats, loadStudentState, sectionProgress } from "@/server/progress";

/**
 * The Dashboard of either environment: Integration Review (/dashboard) or the Final Exam
 * (/final-exam). Same layout and cards; each reads only its own preparation's records.
 */
export async function DashboardView({ prep }: { prep: Prep }) {
  const student = await requireStudent();
  const db = await getDb();
  const now = new Date();
  const [state, loaded, checked] = await Promise.all([loadStudentState(db, student.id, prep), loadStudentModel(db, student, now, prep), loadChecks(db, student.id, prep)]);
  const { routes, today } = loaded;
  const final = prep === "final";
  const stats = dashboardStats(state, today);
  const progress = sectionProgress(state);
  const timeText = formatExamTime(loaded.examTime);
  const countdown = countdownTo(today, loaded.examDate, { nowHHMM: clockHHMM(now), examTime: loaded.examTime });
  const sectionTitle = (id: string) => state.sections.find((s) => s.id === id)?.title ?? id;
  const recent = state.rated.slice(0, 5);
  // The Study Plan's ticks, over every active problem of each section (the same rule as the Study Plan page).
  const rows = progress.map((p) => {
    const list = loaded.problems.filter((x) => x.active && x.sectionId === p.section.id);
    const done = list.filter((x) => checked.has(x.id)).length;
    return { section: p.section, mastered: p.mastered, done, total: list.length, percent: list.length ? Math.round((done / list.length) * 100) : 0 };
  });
  const totalPlanned = rows.reduce((m, r) => m + r.total, 0);
  const totalDone = rows.reduce((m, r) => m + r.done, 0);
  const firstSection = defaultSection(
    rows.map((r) => r.section.id),
    loaded.model.plan.currentUnitId,
  );
  const planAt = firstSection ? planHref(firstSection, "core", prep) : routes.plan;
  // The study card shows the same section numbers as the list below it.
  const progressById = new Map(rows.map((r) => [r.section.id, { done: r.done, total: r.total }]));
  const dueToday = state.pending.filter((i) => i.dueDate <= today);
  const due = dueToday.length ? { problemId: dueToday[0].problemId, href: practiceLink(prep, dueToday[0].problemId, { item: dueToday[0].id }), count: dueToday.length } : null;
  const hasQuestions = loaded.problems.some((p) => p.active);
  const chapterList = FINAL_POOL.map((c) => c.chapter).join(", ").replace(/, (\d+)$/, " and $1");
  const unit = final ? "Chapters" : "Sections";

  return (
    <PageTransition>
      <div className="page">
        {/* "atmos" puts the Stygian library picture behind this header (styles: "the library atmosphere"). */}
        <header className={final ? "page-header atmos atmos-final" : "page-header atmos"}>
          <div>
            <p className="eyebrow">{formatLongDate(today)}</p>
            <h1>
              {greeting(now)}, {student.firstName}.
            </h1>
            <p className="lede">{final ? "Your cumulative MTH 263 final exam preparation at a glance." : `Your ${loaded.examName} preparation at a glance.`}</p>
            {loaded.hasSchedule ? null : (
              <p className="small text-2 lede-note">
                {final ? "Final Exam sessions use the default study times until you set your own: 30 minutes, Monday to Friday. " : "Sessions use the default study times: 30 minutes, Monday to Friday. "}
                <Link href={routes.schedule}>Set your study times</Link>
              </p>
            )}
          </div>
          {final ? <BackToIntegration /> : null}
        </header>

        <div className="dash-top">
          <section className="card exam-card" aria-labelledby="exam-title">
            <div className="stat">
              <span className="stat-icon tone-accent" aria-hidden="true">
                <CalendarDays size={20} />
              </span>
              <div>
                <h2 id="exam-title" style={{ fontSize: "var(--text-md)" }}>
                  {loaded.examName}
                </h2>
                <p className="small text-2">{formatFullDate(loaded.examDate)}</p>
                {timeText ? (
                  <p className="small text-2">
                    <span className="num">{timeText}</span> ET
                  </p>
                ) : null}
              </div>
            </div>
            <div className="exam-days">
              {countdown.kind === "days" ? (
                <>
                  <strong className="num">{countdown.days}</strong>
                  <span className="small text-2">days remaining</span>
                </>
              ) : (
                <span className="pill pill-accent">{countdownLabel(countdown, timeText)}</span>
              )}
            </div>
          </section>

          <div className="stat-strip">
            <Link className="stat-tile" href={routes.progress}>
              <span className="stat-icon tone-success" aria-hidden="true">
                <CircleCheck size={20} />
              </span>
              <span className="stat-value">{totalDone}</span>
              <span className="stat-label">Completed</span>
            </Link>
            <Link className="stat-tile" href={routes.progress}>
              <span className="stat-icon tone-accent" aria-hidden="true">
                <Trophy size={20} />
              </span>
              <span className="stat-value">{stats.sectionsMastered}</span>
              <span className="stat-label">{unit} mastered</span>
            </Link>
            <Link className="stat-tile" href={routes.review}>
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
            <Link className="btn btn-secondary btn-sm" href={routes.review}>
              Go to Review Queue
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        ) : null}

        <div className="dash-main">
          {hasQuestions ? (
            <StudyCard loaded={loaded} progress={progressById} firstTime={stats.completed === 0} due={due} />
          ) : (
            <section className="card card-raised" aria-labelledby="next-title">
              <div className="stack">
                <p className="eyebrow" style={{ margin: 0 }}>
                  Recommended next
                </p>
                <div>
                  <h2 id="next-title" className="continue-title">
                    Final Exam questions are on the way
                  </h2>
                  <p className="text-2">
                    The review questions for Chapters {chapterList} haven&apos;t been added yet. Once they are, your next activity shows up here, sized
                    to your Final Exam study times.
                  </p>
                </div>
                <Link className={`btn btn-block ${loaded.hasSchedule ? "btn-secondary" : "btn-primary"}`} href={routes.schedule}>
                  {loaded.hasSchedule ? "Review your study times" : "Set your study times"}
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </div>
            </section>
          )}

          <section className="card" aria-labelledby="recent-title">
            <h2 id="recent-title" className="card-title">
              Recent Activity
            </h2>
            {recent.length === 0 ? (
              <p className="small text-2">
                {final ? "No Final Exam activity yet. Questions you rate here will show up in this list." : "No activity yet. Problems you rate will show up here."}
              </p>
            ) : (
              <ul className="list">
                {recent.map((r) => (
                  <li key={r.attemptId}>
                    <Link className="row-link" href={routes.practice(r.problemId)}>
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

        {final ? (
          <CoverageCard
            coverage={computeCoverage({
              pool: FINAL_POOL,
              problems: loaded.problems,
              rated: state.rated,
              pending: new Set(state.pending.map((i) => i.problemId)),
            })}
            planHref={planAt}
          />
        ) : (
          <section className="card section-gap" aria-labelledby="plan-progress-title">
            <div className="card-head">
              <h2 id="plan-progress-title" className="card-title">
                Study Plan Progress
              </h2>
              <Link className="card-link" href={planAt}>
                View all <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <p className="small text-2" style={{ marginBottom: 16 }}>
              {totalDone} of {totalPlanned} problems done. Rating a problem ticks it, and you can tick ones you did on paper in the Study Plan.
            </p>
            <ul className="list">
              {rows.map((p) => (
                <li key={p.section.id} style={{ padding: "12px 0" }}>
                  <div className="progress-row">
                    <Link href={planHref(p.section.id, "core", prep)} className="small" style={{ fontWeight: 600, color: "var(--text)", textDecoration: "none" }}>
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
        )}
      </div>
    </PageTransition>
  );
}

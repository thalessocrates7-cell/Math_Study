import { ArrowRight, Check, CircleX, Layers, PartyPopper, Sparkle, TriangleExclamationPoint } from "lucide-react";
import Link from "next/link";
import { DifficultyBadge, problemLabel, RatingPill } from "@/components/Badges";
import { PageTransition } from "@/components/PageTransition";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { formatMonthDay, relativeDay, todayISO } from "@/lib/dates";
import { practiceLink, type Prep } from "@/lib/prep";
import { loadStudentState, recommend, reviewGroups } from "@/server/progress";

const REASONS = {
  shaky: { label: "You marked this Shaky", tone: "tone-warning", Icon: TriangleExclamationPoint },
  lost: { label: "You marked this Lost", tone: "tone-danger", Icon: CircleX },
  got_it: { label: "Retention check", tone: "tone-success", Icon: Check },
  similar: { label: "Similar problem", tone: "tone-accent", Icon: Layers },
  easier: { label: "Easier problem", tone: "tone-accent", Icon: Sparkle },
} as const;

/** The Review Queue of either environment (/review or /final-exam/review): only its own review items. */
export async function ReviewView({ prep }: { prep: Prep }) {
  const student = await requireStudent();
  const db = await getDb();
  const today = todayISO();
  const state = await loadStudentState(db, student.id, prep);
  const groups = reviewGroups(state, today);
  const due = [...groups[0].items, ...groups[1].items];
  const pendingTotal = groups.reduce((m, g) => m + g.items.length, 0);
  const title = (id: string) => state.sections.find((s) => s.id === id)?.title ?? id;
  const next = recommend(state, today, prep);

  return (
    <PageTransition>
      <div className="page page-narrow">
        <header className="page-header">
          <div>
            <h1>Review Queue</h1>
            <p className="lede">{prep === "final" ? "Final Exam questions to revisit and strengthen your understanding." : "Problems to revisit and strengthen your understanding."}</p>
          </div>
          {due.length > 0 ? (
            <Link className="btn btn-primary" href={practiceLink(prep, due[0].problemId, { item: due[0].id })}>
              Start Review
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          ) : null}
        </header>

        {pendingTotal === 0 ? (
          <section className="card empty" aria-labelledby="caught-up">
            <span className="empty-icon" aria-hidden="true">
              <PartyPopper size={26} />
            </span>
            <h2 id="caught-up">All caught up!</h2>
            <p className="text-2">Nothing to review yet. When you rate a problem Shaky or Lost, it shows up here at the right time.</p>
            {next.kind !== "done" ? (
              <Link className="btn btn-secondary" href={next.href}>
                Practice something new
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            ) : null}
          </section>
        ) : (
          <>
            {due.length === 0 ? (
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                <Check size={18} aria-hidden="true" />
                <p>
                  Nothing is due today. {groups[2].items.length > 0 ? `${groups[2].items.length} problem${groups[2].items.length === 1 ? "" : "s"} come back tomorrow.` : "Upcoming reviews are listed below."}
                </p>
              </div>
            ) : null}
            {groups
              .filter((g) => g.items.length > 0)
              .map((g) => (
                <section key={g.key} className="card queue-group" aria-labelledby={`group-${g.key}`}>
                  <h2 id={`group-${g.key}`}>
                    {g.label} <span className="pill pill-neutral num">{g.items.length}</span>
                  </h2>
                  {g.key === "overdue" ? <p className="small text-2" style={{ marginBottom: 8 }}>Overdue: please review these first.</p> : null}
                  <ul className="list">
                    {g.items.map((item) => {
                      const reason = REASONS[item.reason];
                      const isDue = item.dueDate <= today;
                      const body = (
                        <>
                          <span className={`reason-icon ${reason.tone}`} aria-hidden="true">
                            <reason.Icon size={18} />
                          </span>
                          <span className="row-main">
                            <span className="row-title small">
                              {item.sectionId} – {title(item.sectionId)} · {problemLabel(item.openstaxNumber, item.problemId)}
                            </span>
                            <span className="row-sub">
                              {reason.label}
                              {item.lastRatedAt ? ` · Last attempt ${formatMonthDay(todayISO(item.lastRatedAt))}` : ""}
                            </span>
                            <span className="cluster" style={{ marginTop: 4 }}>
                              <DifficultyBadge d={item.difficulty} />
                              {item.lastRating && item.lastRating !== "skipped" ? <RatingPill rating={item.lastRating} /> : null}
                            </span>
                          </span>
                          {isDue ? (
                            <span className="btn btn-secondary btn-sm" aria-hidden="true">
                              Practice now
                            </span>
                          ) : (
                            <span className="pill pill-neutral">Due {relativeDay(item.dueDate, today)}</span>
                          )}
                        </>
                      );
                      return (
                        <li key={item.id}>
                          {isDue ? (
                            <Link
                              className="row-link"
                              href={practiceLink(prep, item.problemId, { item: item.id })}
                              aria-label={`Practice now: ${item.sectionId} ${problemLabel(item.openstaxNumber, item.problemId)}, ${reason.label}`}
                            >
                              {body}
                            </Link>
                          ) : (
                            <div className="row-link" style={{ cursor: "default" }}>
                              {body}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
          </>
        )}
      </div>
    </PageTransition>
  );
}

import { ArrowRight, CalendarDays, PartyPopper, Sparkles } from "lucide-react";
import Link from "next/link";
import { finishSessionAction, keepGoingAction, startSessionAction } from "@/app/actions/session";
import { DifficultyBadge } from "@/components/Badges";
import { PageTransition } from "@/components/PageTransition";
import { ProgressBar } from "@/components/Progress";
import { plannedRows, savedRows, whereText } from "@/components/session/rows";
import { ItemList, TrackPill } from "@/components/session/SessionParts";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { formatLongDate } from "@/lib/dates";
import { pacingText } from "@/lib/pacing-text";
import type { Prep } from "@/lib/prep";
import { reasonText } from "@/lib/reasons";
import type { PlannedItem } from "@/lib/session-builder";
import { type Loaded, loadStudentModel, type SessionWithItems } from "@/server/model";
import {
  keepGoingFor,
  nextEssential,
  nextOptional,
  openSessionOf,
  practiceHref,
  previewNextSession,
  SESSION_LENGTHS,
  sessionProgress,
} from "@/server/sessions";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const earlier = (all: SessionWithItems[], featured: SessionWithItems | null) => all.filter((s) => s !== featured);

/** "How much time do you have?": each length starts a session planned to fit it. */
function TimeChoices({ label, id, prep }: { label: string; id: string; prep: Prep }) {
  return (
    <form action={startSessionAction} className="stack-sm" aria-labelledby={id}>
      <input type="hidden" name="prep" value={prep} />
      <p id={id} className="small" style={{ fontWeight: 600 }}>
        {label}
      </p>
      <div className="time-choices">
        {SESSION_LENGTHS.map((m) => (
          <button key={m} className="btn btn-secondary num" type="submit" name="minutes" value={m}>
            {`${m} min`}
          </button>
        ))}
      </div>
    </form>
  );
}

function KeepGoing({ loaded, extras }: { loaded: Loaded; extras: PlannedItem[] }) {
  return (
    <section className="card section-gap" aria-labelledby="more-title">
      <div className="card-head">
        <h2 id="more-title" className="card-title">
          Keep going
        </h2>
        <span className="pill pill-neutral">Optional</span>
      </div>
      <p className="small text-2" style={{ marginBottom: 8 }}>
        Extra practice beyond today&apos;s plan. Going over your planned time is fine.
      </p>
      <ul className="list session-items">
        {extras.map((x) => {
          const reason = reasonText(x.reason, loaded.lookup);
          return (
            <li key={x.problemId} className="session-item">
              <div className="row-link row-static">
                <span className="row-main">
                  <span className="item-tags">
                    <TrackPill track={x.track} />
                    <DifficultyBadge d={loaded.problemById.get(x.problemId)?.difficulty ?? "C"} />
                  </span>
                  <span className="item-reason">{reason}</span>
                  <span className="row-sub">
                    {whereText(loaded, x.problemId)} · <span className="num">about {x.minutes} min</span>
                  </span>
                </span>
              </div>
              <form action={keepGoingAction}>
                <input type="hidden" name="prep" value={loaded.prep} />
                <input type="hidden" name="problem" value={x.problemId} />
                <button className="btn btn-secondary btn-sm" type="submit">
                  Start<span className="sr-only">: {reason}</span>
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Today's Session of either environment (/session or /final-exam/session), with its own sessions and plan. */
export async function SessionView({ prep }: { prep: Prep }) {
  const student = await requireStudent();
  const db = await getDb();
  const loaded = await loadStudentModel(db, student, new Date(), prep);
  if (!loaded.problems.some((p) => p.active)) {
    // The Final Exam before its questions are added: nothing to plan, and no pacing to claim.
    return (
      <PageTransition>
        <div className="page page-narrow">
          <header className="page-header">
            <div>
              <p className="eyebrow">{formatLongDate(loaded.today)}</p>
              <h1>Today&apos;s Session</h1>
            </div>
          </header>
          <section className="card session-hero" aria-labelledby="hero-title">
            <span className="empty-icon tone-accent" aria-hidden="true">
              <CalendarDays size={26} />
            </span>
            <h2 id="hero-title" className="continue-title">
              No questions to plan yet
            </h2>
            <p className="text-2">Sessions start once the {loaded.examName} questions are added. Until then, you can set your study times.</p>
            <Link className="btn btn-secondary" href={loaded.routes.schedule}>
              Set your study times
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </section>
        </div>
      </PageTransition>
    );
  }
  const pacing = pacingText(loaded.model.plan.pacing);
  const open = openSessionOf(loaded.todaySessions);
  const latest = loaded.todaySessions[loaded.todaySessions.length - 1] ?? null;
  // The session the main card is about (listed under "Earlier today" otherwise).
  let featured = open;

  let body: React.ReactNode;
  if (open) {
    // A session in progress (or paused).
    const prog = sessionProgress(open, loaded);
    const next = nextEssential(open.items) ?? nextOptional(open.items);
    const paused = open.session.status === "paused";
    body = (
      <>
        <section className="card session-hero" aria-labelledby="hero-title">
          <p className="eyebrow">
            Session {open.session.slot} · <span className="num">{open.session.budgetMinutes}</span> min{paused ? " · Paused" : ""}
          </p>
          <h2 id="hero-title" className="continue-title">
            {prog.done === 0 ? "Ready when you are" : `${prog.done} of ${prog.total} done`}
          </h2>
          <p className="text-2">
            {prog.spentMinutes > 0
              ? `About ${prog.spentMinutes} of ${open.session.budgetMinutes} minutes so far.`
              : `${plural(prog.total, "problem")}, about ${prog.plannedMinutes} minutes.`}
          </p>
          <ProgressBar value={prog.done} max={prog.total} label="Today's session" />
          {next ? (
            <Link className="btn btn-primary btn-block btn-lg" href={practiceHref(next, prep)}>
              {paused ? "Resume" : prog.done === 0 ? "Start the first problem" : "Continue"}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          ) : null}
          <form action={finishSessionAction} className="hero-foot">
            <input type="hidden" name="prep" value={prep} />
            <input type="hidden" name="session" value={open.session.id} />
            <button className="btn btn-ghost btn-sm" type="submit">
              Finish for today
            </button>
            <span className="xsmall muted">Anything unfinished moves to your next session.</span>
          </form>
        </section>
        <section className="card section-gap" aria-labelledby="items-title">
          <h2 id="items-title" className="card-title">
            In this session
          </h2>
          <ItemList rows={savedRows(loaded, open.items, next?.id ?? null)} label="Problems in today's session" />
        </section>
      </>
    );
  } else {
    const plan = previewNextSession(loaded);
    const scheduled = plan.scheduledMinutes !== null;
    const planned = plan.items.length + (plan.bonus ? 1 : 0);
    const startable = scheduled && planned > 0;
    // Keep going only once nothing scheduled is waiting (one main action per screen).
    const extras = !startable && (latest || scheduled) ? keepGoingFor(loaded) : [];
    if (!startable) featured = latest;

    let hero: React.ReactNode;
    if (startable) {
      // Today's next scheduled session, ready to start.
      const minutes = plan.items.reduce((m, i) => m + i.minutes, 0);
      hero = (
        <section className="card session-hero" aria-labelledby="hero-title">
          <p className="eyebrow">
            {latest ? `Session ${plan.slot}` : "Today's plan"} · <span className="num">{plan.minutes}</span> min
          </p>
          <h2 id="hero-title" className="continue-title">
            {latest ? `Start session ${plan.slot}` : "Start today's session"}
          </h2>
          <p className="text-2">
            {plural(plan.items.length, "problem")}, about {minutes} minutes{plan.bonus ? ", plus an optional bonus" : ""}. Your time only counts
            while a problem is on screen.
          </p>
          <form action={startSessionAction}>
            <input type="hidden" name="prep" value={prep} />
            <input type="hidden" name="minutes" value={plan.minutes} />
            <button className="btn btn-primary btn-block btn-lg" type="submit">
              Start session
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>
          <details className="disclosure">
            <summary>Different amount of time today?</summary>
            <TimeChoices id="other-time" label="How much time do you have?" prep={prep} />
          </details>
        </section>
      );
    } else if (latest) {
      // Everything scheduled for today is done.
      const prog = sessionProgress(latest, loaded);
      hero = (
        <section className="card session-hero is-done" aria-labelledby="hero-title">
          <span className="empty-icon" aria-hidden="true">
            <PartyPopper size={26} />
          </span>
          <h2 id="hero-title" className="continue-title">
            Today&apos;s session is done
          </h2>
          <p className="text-2">
            {plural(prog.done, "problem")}
            {prog.spentMinutes > 0 ? `, about ${prog.spentMinutes} minutes` : ""}. Nice work. Your next session picks up from here.
          </p>
          <TimeChoices id="more-time" label="Have more time today?" prep={prep} />
        </section>
      );
    } else if (scheduled) {
      // A study day, but there's nothing to plan right now.
      hero = (
        <section className="card session-hero" aria-labelledby="hero-title">
          <span className="empty-icon tone-accent" aria-hidden="true">
            <Sparkles size={26} />
          </span>
          <h2 id="hero-title" className="continue-title">
            Nothing planned right now
          </h2>
          <p className="text-2">You&apos;ve covered everything the plan has for today. Extra practice is below if you want it.</p>
        </section>
      );
    } else {
      // Not a study day.
      hero = (
        <section className="card session-hero" aria-labelledby="hero-title">
          <span className="empty-icon tone-accent" aria-hidden="true">
            <CalendarDays size={26} />
          </span>
          <h2 id="hero-title" className="continue-title">
            No session planned today
          </h2>
          <p className="text-2">Have some time anyway? Choose how long, and the plan fits a session to it.</p>
          <TimeChoices id="free-time" label="How much time do you have?" prep={prep} />
        </section>
      );
    }

    body = (
      <>
        {hero}
        {startable ? (
          <section className="card section-gap" aria-labelledby="items-title">
            <h2 id="items-title" className="card-title">
              What&apos;s planned
            </h2>
            <ItemList rows={plannedRows(loaded, plan.items, plan.bonus)} label="Problems planned for this session" />
          </section>
        ) : null}
        {extras.length > 0 ? <KeepGoing loaded={loaded} extras={extras} /> : null}
        {latest && latest.items.some((i) => i.status === "pending" || i.status === "active") ? (
          <section className="card section-gap" aria-labelledby="latest-title">
            <h2 id="latest-title" className="card-title">
              Still open from session {latest.session.slot}
            </h2>
            <ItemList
              rows={savedRows(
                loaded,
                latest.items.filter((i) => i.status === "pending" || i.status === "active"),
                null,
              )}
              label={`Open problems from session ${latest.session.slot}`}
            />
          </section>
        ) : null}
      </>
    );
  }

  return (
    <PageTransition>
      <div className="page page-narrow">
        <header className="page-header">
          <div>
            <p className="eyebrow">{formatLongDate(loaded.today)}</p>
            <h1>Today&apos;s Session</h1>
            <p className="lede">{pacing.detail}</p>
          </div>
          <span className={`pill pill-${pacing.tone}`}>{pacing.label}</span>
        </header>
        {body}
        {earlier(loaded.todaySessions, featured).length > 0 ? (
          <section className="card section-gap" aria-labelledby="earlier-title">
            <h2 id="earlier-title" className="card-title">
              Earlier today
            </h2>
            <ul className="list">
              {earlier(loaded.todaySessions, featured).map((s) => {
                const p = sessionProgress(s, loaded);
                return (
                  <li key={s.session.id} className="spread small" style={{ padding: "12px 0" }}>
                    <span style={{ fontWeight: 600 }}>Session {s.session.slot}</span>
                    <span className="text-2 num">
                      {p.done} of {p.total} done{p.spentMinutes > 0 ? ` · about ${p.spentMinutes} min` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </PageTransition>
  );
}

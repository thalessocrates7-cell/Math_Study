import { ArrowRight, CalendarDays, PartyPopper } from "lucide-react";
import Link from "next/link";
import { startSessionAction } from "@/app/actions/session";
import { ProgressBar } from "@/components/Progress";
import { reasonText } from "@/lib/reasons";
import type { Loaded } from "@/server/model";
import { nextEssential, nextOptional, openSessionOf, practiceHref, previewNextSession, sessionProgress } from "@/server/sessions";
import { TrackPill } from "./SessionParts";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The dashboard's main card: today's session to start or continue (the plan is only previewed here). */
export function TodayCard({ loaded }: { loaded: Loaded }) {
  const open = openSessionOf(loaded.todaySessions);
  if (open) {
    const prog = sessionProgress(open, loaded);
    const next = nextEssential(open.items) ?? nextOptional(open.items);
    const paused = open.session.status === "paused";
    return (
      <section className="card today-card" aria-labelledby="today-title">
        <p className="eyebrow">
          Today&apos;s session · {paused ? "Paused" : "In progress"}
        </p>
        <h2 id="today-title" className="continue-title">
          {prog.done === 0 ? "Pick up today's session" : `${prog.done} of ${prog.total} done`}
        </h2>
        <p className="text-2">
          {prog.spentMinutes > 0 ? `About ${prog.spentMinutes} of ${open.session.budgetMinutes} minutes so far.` : `${plural(prog.total, "problem")} planned.`}
        </p>
        <ProgressBar value={prog.done} max={prog.total} label="Today's session" />
        <Link className="btn btn-primary btn-block" href={next ? practiceHref(next) : "/session"}>
          {paused ? "Resume" : "Continue"}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
    );
  }

  const plan = previewNextSession(loaded);
  const latest = loaded.todaySessions[loaded.todaySessions.length - 1] ?? null;
  if (plan.scheduledMinutes !== null && plan.items.length > 0) {
    const minutes = plan.items.reduce((m, i) => m + i.minutes, 0);
    return (
      <section className="card today-card" aria-labelledby="today-title">
        <p className="eyebrow">
          {latest ? `Session ${plan.slot}` : "Today's plan"} · <span className="num">{plan.minutes}</span> min
        </p>
        <h2 id="today-title" className="continue-title">
          {latest ? `Ready for session ${plan.slot}` : "Today's session"}
        </h2>
        <p className="text-2">
          {plural(plan.items.length, "problem")}, about {minutes} minutes.
        </p>
        <ul className="today-peek" aria-label="First problems in the plan">
          {plan.items.slice(0, 3).map((it) => (
            <li key={it.problemId}>
              <TrackPill track={it.track} />
              <span className="small text-2">{reasonText(it.reason, loaded.lookup)}</span>
            </li>
          ))}
        </ul>
        <div className="today-actions">
          <form action={startSessionAction}>
            <input type="hidden" name="minutes" value={plan.minutes} />
            <button className="btn btn-primary" type="submit">
              Start session
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>
          <Link className="btn btn-ghost" href="/session">
            See the whole plan
          </Link>
        </div>
      </section>
    );
  }

  if (latest) {
    const prog = sessionProgress(latest, loaded);
    return (
      <section className="card today-card is-done" aria-labelledby="today-title">
        <span className="empty-icon" aria-hidden="true">
          <PartyPopper size={26} />
        </span>
        <h2 id="today-title" className="continue-title">
          Today&apos;s session is done
        </h2>
        <p className="text-2">
          {plural(prog.done, "problem")}
          {prog.spentMinutes > 0 ? `, about ${prog.spentMinutes} minutes` : ""}. Want more? Extra practice is optional.
        </p>
        <Link className="btn btn-secondary" href="/session">
          Keep going
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
    );
  }

  return (
    <section className="card today-card" aria-labelledby="today-title">
      <span className="empty-icon tone-accent" aria-hidden="true">
        <CalendarDays size={26} />
      </span>
      <h2 id="today-title" className="continue-title">
        {plan.scheduledMinutes === null ? "No session planned today" : "Nothing planned right now"}
      </h2>
      <p className="text-2">
        {plan.scheduledMinutes === null
          ? "Have some time anyway? Choose how long, and the plan fits a session to it."
          : "You've covered everything the plan has for today."}
      </p>
      <Link className="btn btn-secondary" href="/session">
        {plan.scheduledMinutes === null ? "Study anyway" : "See extra practice"}
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </section>
  );
}

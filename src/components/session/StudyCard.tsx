import { ArrowRight, PartyPopper } from "lucide-react";
import Link from "next/link";
import { startSessionAction } from "@/app/actions/session";
import { DifficultyBadge } from "@/components/Badges";
import { ProgressBar } from "@/components/Progress";
import { chooseStudyCard, type StudyCardInput } from "@/lib/study-card";
import type { Loaded } from "@/server/model";
import { nextEssential, nextOptional, openSessionOf, practiceHref, previewNextSession } from "@/server/sessions";

type Props = {
  loaded: Loaded;
  /** Each section's progress, as the Study Plan Progress list on the same page shows it. */
  progress: Map<string, { done: number; total: number }>;
  /** Nothing rated yet: the card says "Start Studying" instead of "Continue Studying". */
  firstTime: boolean;
  /** The first review problem due today, if any. */
  due: { problemId: string; href: string; count: number } | null;
};

/**
 * The Dashboard's main card, in its original "Recommended next" layout. The button starts today's
 * session (or continues the open one), so the card names that session's next problem.
 */
export function StudyCard({ loaded, progress, firstTime, due }: Props) {
  const { routes, prep } = loaded;
  const unit = prep === "final" ? "Chapter" : "Section";
  const open = openSessionOf(loaded.todaySessions);
  const plan = previewNextSession(loaded);
  let openInput: StudyCardInput["open"] = null;
  if (open) {
    const next = nextEssential(open.items) ?? nextOptional(open.items);
    const planned = open.items.filter((i) => i.essential && i.status !== "dropped");
    const at = next ? planned.findIndex((i) => i.id === next.id) : -1;
    openInput = {
      next: next ? { problemId: next.problemId, href: practiceHref(next, prep), track: next.track, essential: next.essential } : null,
      index: at >= 0 ? at + 1 : null,
      total: planned.length,
    };
  }
  const card = chooseStudyCard({
    open: openInput,
    plan: { problemIds: plan.items.map((i) => i.problemId), minutes: plan.minutes, scheduled: plan.scheduledMinutes !== null },
    doneToday: !open && loaded.todaySessions.length > 0,
    due,
    sessionHref: routes.session,
  });

  if (card.kind === "done-today" || card.kind === "caught-up") {
    return (
      <section className="card" aria-labelledby="next-title">
        <div className="empty">
          <span className="empty-icon" aria-hidden="true">
            <PartyPopper size={26} />
          </span>
          {card.kind === "done-today" ? (
            <>
              <h2 id="next-title">Today&apos;s session is done</h2>
              <p className="text-2">Want more? Extra practice is optional.</p>
              <Link className="btn btn-secondary" href={routes.session}>
                Keep going
              </Link>
            </>
          ) : (
            <>
              <h2 id="next-title">All caught up!</h2>
              <p className="text-2">Your study plan is done and nothing is due right now. Check back tomorrow for review problems.</p>
              <Link className="btn btn-secondary" href={routes.progress}>
                See your progress
              </Link>
            </>
          )}
        </div>
      </section>
    );
  }

  if (card.kind === "review") {
    return (
      <section className="card" aria-labelledby="next-title">
        <div className="stack">
          <p className="eyebrow" style={{ margin: 0 }}>
            Recommended next
          </p>
          <h2 id="next-title" className="continue-title">
            Review what felt shaky
          </h2>
          <p className="text-2">
            Your study plan is complete. {card.count} review problem{card.count === 1 ? " is" : "s are"} due.
          </p>
          <Link className="btn btn-primary btn-block" href={card.href}>
            Start review
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  const problem = card.problemId ? loaded.problemById.get(card.problemId) : undefined;
  const section = problem ? loaded.sectionById.get(problem.sectionId) : undefined;
  const sp = section ? progress.get(section.id) : undefined;
  const easier = card.kind === "continue" && card.easier;
  const title = card.kind === "continue" || !firstTime ? "Continue Studying" : "Start Studying";
  const place =
    card.kind === "start" ? ` · Problem 1 of ${card.total}` : card.index ? ` · Problem ${card.index} of ${card.total}` : " · Extra practice";
  const label = easier ? "Try the easier problem" : title;

  return (
    <section className="card" aria-labelledby="next-title">
      <div className="stack">
        <div className="spread">
          <p className="eyebrow" style={{ margin: 0 }}>
            {easier ? "Recommended next: an easier problem on the same idea" : "Recommended next"}
          </p>
          {problem ? <DifficultyBadge d={problem.difficulty} /> : null}
        </div>
        <div>
          <h2 id="next-title" className="continue-title">
            {title}
          </h2>
          {section ? (
            <p className="text-2">
              {section.id} – {section.title}
              {place}
            </p>
          ) : null}
        </div>
        {section && sp ? (
          <div className="stack-sm">
            <div className="spread small">
              <span className="text-2">{unit} progress</span>
              <span className="num">
                {sp.done} / {sp.total} ({sp.total ? Math.round((sp.done / sp.total) * 100) : 0}%)
              </span>
            </div>
            <ProgressBar value={sp.done} max={sp.total} label={`${unit} ${section.id} progress`} />
          </div>
        ) : null}
        {card.kind === "start" ? (
          <form action={startSessionAction}>
            <input type="hidden" name="prep" value={prep} />
            <input type="hidden" name="minutes" value={card.minutes} />
            <button className="btn btn-primary btn-block" type="submit">
              {label}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>
        ) : (
          <Link className="btn btn-primary btn-block" href={card.href}>
            {label}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        )}
      </div>
    </section>
  );
}

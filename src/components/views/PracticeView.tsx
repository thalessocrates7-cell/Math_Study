import { CircleX, TriangleExclamationPoint, X } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DIFFICULTIES, DIFFICULTY_BLURB, DIFFICULTY_LABEL } from "@content/types";
import { skipItemAction } from "@/app/actions/session";
import { DifficultyBadge, problemLabel, RatingPill } from "@/components/Badges";
import { FunctionPlot } from "@/components/FunctionPlot";
import { PageTransition } from "@/components/PageTransition";
import { Workspace } from "@/components/practice/Workspace";
import { ProgressBar } from "@/components/Progress";
import { TrackPill } from "@/components/session/SessionParts";
import { getDb } from "@/db/client";
import { requireStudent } from "@/lib/auth";
import { difficultyToLevel, exitHref, planHref } from "@/lib/checklist";
import { formatMonthDay } from "@/lib/dates";
import { UUID_RE } from "@/lib/ids";
import { practiceLink, type Prep, routesFor } from "@/lib/prep";
import { renderRich } from "@/lib/tex";
import { type HistoryRow, problemHistory, workspaceData } from "@/server/practice";
import { sessionBarFor } from "@/server/sessions";

export type PracticeProps = {
  params: Promise<{ problemId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const REASON: Record<string, string> = {
  shaky: "Review: you marked this one Shaky",
  lost: "Review: you marked this one Lost",
  got_it: "Retention check: you got this one before",
  similar: "Similar problem for extra practice",
  easier: "Easier problem on the same idea",
};

function helpText(h: HistoryRow): string {
  const used = [h.hintsShown > 0 ? `${h.hintsShown} hint${h.hintsShown === 1 ? "" : "s"}` : null, h.answerRevealed ? "answer" : null, h.solutionViewed ? "worked solution" : null].filter(Boolean);
  return used.length ? `Used ${used.join(", ")}` : "No help used";
}

/**
 * A practice problem, inside the environment it belongs to: /practice/... for Integration Review,
 * /final-exam/practice/... for the Final Exam. Opened under the other environment's address, it
 * moves to its own (keeping the session or review link), so its sidebar and links always match.
 */
export async function PracticeView({ prep, params, searchParams }: PracticeProps & { prep: Prep }) {
  const student = await requireStudent();
  const { problemId: raw } = await params;
  const sp = await searchParams;
  const problemId = decodeURIComponent(raw);
  const itemId = typeof sp.item === "string" ? sp.item : null;
  const sessionParam = typeof sp.s === "string" && UUID_RE.test(sp.s) ? sp.s : null;
  const db = await getDb();
  const [data, bar, history] = await Promise.all([
    workspaceData(db, student.id, problemId, itemId),
    sessionParam ? sessionBarFor(db, student.id, sessionParam, problemId) : Promise.resolve(null),
    problemHistory(db, student.id, problemId),
  ]);
  if (!data) notFound();
  if (data.prep !== prep) {
    redirect(practiceLink(data.prep, problemId, { s: sessionParam ?? undefined, item: itemId && UUID_RE.test(itemId) ? itemId : undefined }));
  }
  const routes = routesFor(prep);
  const final = prep === "final";

  const { problem, section } = data;
  const label = problemLabel(problem.openstaxNumber, problem.id);
  const pct = data.total ? Math.round((data.done / data.total) * 100) : 0;
  const itemOpen = bar ? bar.item.status !== "done" && bar.item.status !== "skipped" : false;
  const tag = bar
    ? bar.index
      ? `Problem ${bar.index} of ${bar.total} · ${label}`
      : `Extra practice · ${label}`
    : data.position
      ? `${DIFFICULTY_LABEL[problem.difficulty]} ${data.position} · ${label}`
      : `Extra practice · ${label}`;

  const asideTop = (
    <>
      <section className="card side-card" aria-labelledby="section-info-title">
        <h2 id="section-info-title">{prep === "final" ? "Chapter Info" : "Section Info"}</h2>
        <p className="small" style={{ fontWeight: 600 }}>
          {section.id} – {section.title}
        </p>
        <p className="small text-2" style={{ marginTop: 8 }}>
          <span style={{ fontWeight: 600, color: "var(--text)" }}>Learning objective: </span>
          {section.objectives[Math.min(section.objectives.length - 1, 0)]}
        </p>
        {problem.concepts.length ? (
          <p className="xsmall muted" style={{ marginTop: 8 }}>
            Skills: {problem.concepts.map((c) => section.concepts.find((x) => x.id === c)?.label ?? c).join(", ")}
          </p>
        ) : null}
      </section>
      <section className="card side-card" aria-labelledby="levels-title">
        <h2 id="levels-title">Difficulty Levels</h2>
        <ul className="legend-list">
          {DIFFICULTIES.map((d) => (
            <li key={d}>
              <DifficultyBadge d={d} short decorative />
              <span>
                <strong>{DIFFICULTY_LABEL[d]}</strong> <span className="muted">– {DIFFICULTY_BLURB[d]}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );

  const asideBottom = (
    <>
      {history.length > 0 ? (
        <section className="card side-card" aria-labelledby="history-title">
          <h2 id="history-title">Your Earlier Tries</h2>
          <ul className="list">
            {history.slice(0, 5).map((h) => (
              <li key={h.id} className="history-row">
                <span className="row-main">
                  <span className="small" style={{ fontWeight: 600 }}>
                    {formatMonthDay(h.ratedDay)}
                  </span>
                  <span className="row-sub">{helpText(h)}</span>
                </span>
                <RatingPill rating={h.rating} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {data.recentWeak.length > 0 ? (
        <section className="card side-card" aria-labelledby="recent-review-title">
          <h2 id="recent-review-title">{prep === "final" ? "Recent Review in This Chapter" : "Recent Review in This Section"}</h2>
          <ul className="list">
            {data.recentWeak.map((w) => (
              <li key={w.problemId}>
                <Link className="row-link small" href={routes.practice(w.problemId)}>
                  {w.rating === "lost" ? (
                    <CircleX size={16} aria-hidden="true" style={{ color: "var(--danger-icon)" }} />
                  ) : (
                    <TriangleExclamationPoint size={16} aria-hidden="true" style={{ color: "var(--warning-icon)" }} />
                  )}
                  <span className="row-main">
                    <span>{problemLabel(w.openstaxNumber, w.problemId)}</span>
                    <span className="row-sub">Last rated {w.rating === "lost" ? "Lost" : "Shaky"}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );

  const planLink = planHref(section.id, difficultyToLevel(problem.difficulty), prep);
  const crumb = bar
    ? { href: routes.session, text: "Today's Session" }
    : data.reviewItem
      ? { href: routes.review, text: "Review Queue" }
      : { href: planLink, text: "Study Plan" };
  // X leaves the problem: back to today's session, or to this problem's own section and level in the Study Plan.
  const exit = exitHref({ sessionId: bar ? bar.sessionId : null, sectionId: section.id, difficulty: problem.difficulty, problemId: problem.id, prep });
  const exitTo = bar ? "Today's Session" : `${section.id} ${DIFFICULTY_LABEL[problem.difficulty]} in the Study Plan`;
  // Previous / Next walk the Study Plan's list, so they show only for problems opened from the Study Plan.
  // Past either end they do what X does.
  const pager =
    !bar && !data.reviewItem && data.position
      ? {
          prevHref: data.prevId ? routes.practice(data.prevId) : exit,
          nextHref: data.nextId ? routes.practice(data.nextId) : exit,
          prevLabel: data.prevId ? undefined : `Previous: back to ${exitTo}`,
          nextLabel: data.nextId ? undefined : `Next: back to ${exitTo}`,
          label: `${DIFFICULTY_LABEL[problem.difficulty]} ${data.position} of ${data.total}`,
        }
      : null;

  return (
    <PageTransition>
      <div className="page">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href={crumb.href}>{crumb.text}</Link>
            </li>
            <li>
              <Link href={planLink}>{`${section.id} ${section.title}`}</Link>
            </li>
            <li aria-current="page">Practice</li>
          </ol>
        </nav>
        <header className="page-header practice-header" style={{ marginBottom: 12 }}>
          <div className="practice-title">
            <h1>
              {section.id} – {section.title}
            </h1>
            {!bar && data.reviewItem ? <p className="lede">{REASON[data.reviewItem.reason]}</p> : null}
          </div>
          <span className="practice-level">
            <DifficultyBadge d={problem.difficulty} />
          </span>
          <Link className="icon-btn exit-btn" href={exit} aria-label={`Exit practice, back to ${exitTo}`} title={`Back to ${exitTo}`}>
            <X size={22} aria-hidden="true" />
          </Link>
        </header>

        {bar ? (
          <>
            <div className="ws-progress">
              <div className="spread small">
                <span style={{ fontWeight: 600 }}>Today&apos;s session</span>
                <span className="text-2 num">
                  {bar.done} of {bar.total} done{bar.spentMinutes > 0 ? ` · about ${bar.spentMinutes} of ${bar.budgetMinutes} min` : ""}
                </span>
              </div>
              <ProgressBar value={bar.done} max={bar.total} label="Today's session" />
            </div>
            <section className="why" aria-label="Why this problem">
              <TrackPill track={bar.item.track} bonus={bar.item.reason.code === "bonus_challenge"} />
              <p className="small">{bar.reasonText}</p>
              {itemOpen && bar.item.track === "lookback" ? (
                <form action={skipItemAction} className="why-skip">
                  <input type="hidden" name="prep" value={prep} />
                  <input type="hidden" name="item" value={bar.item.id} />
                  <input type="hidden" name="from" value="practice" />
                  <button className="btn btn-ghost btn-sm" type="submit">
                    Skip this look-back
                  </button>
                </form>
              ) : null}
            </section>
          </>
        ) : data.position ? (
          <div className="ws-progress">
            <div className="spread small">
              <span style={{ fontWeight: 600 }}>
                {DIFFICULTY_LABEL[problem.difficulty]} {data.position} of {data.total}
              </span>
              <span className="text-2 num">{pct}% complete</span>
            </div>
            <ProgressBar value={data.done} max={data.total} label={`Section ${section.id} ${DIFFICULTY_LABEL[problem.difficulty]} progress`} />
          </div>
        ) : null}
        {!problem.active ? (
          <div className="alert alert-warning" style={{ marginBottom: 16 }}>
            This problem was retired by your instructor. You can still finish this review.
          </div>
        ) : null}

        <Workspace
          key={`${problem.id}:${itemId ?? ""}:${bar?.item.id ?? ""}`}
          problemId={problem.id}
          itemId={data.reviewItem?.id ?? null}
          sessionItemId={bar ? bar.item.id : null}
          sessionId={bar ? bar.sessionId : null}
          estimateMinutes={bar ? bar.item.minutes : null}
          tag={tag}
          statementHtml={renderRich(problem.statement)}
          figure={problem.figure ? <FunctionPlot spec={problem.figure} /> : null}
          hintsHtml={problem.hints.map((h) => renderRich(h))}
          answerHtml={renderRich(problem.answer)}
          steps={problem.steps.map((s) => ({ title: s.title, html: renderRich(s.body) }))}
          note={data.note}
          pager={pager}
          asideTop={asideTop}
          asideBottom={asideBottom}
        />
        <p className="xsmall muted" style={{ marginTop: 24 }}>
          {final
            ? problem.openstaxNumber
              ? `From OpenStax Calculus Volume 1, Chapter ${section.id} Review Exercises, Exercise ${problem.openstaxNumber} (CC BY-NC-SA 4.0).`
              : `Original practice problem in the style of OpenStax Calculus Volume 1, Chapter ${section.id}.`
            : problem.openstaxNumber
              ? `Adapted from OpenStax Calculus Volume 1, Section ${section.id}, Exercise ${problem.openstaxNumber} (CC BY-NC-SA 4.0).`
              : `Original practice problem in the style of OpenStax Calculus Volume 1, Section ${section.id}.`}
        </p>
      </div>
    </PageTransition>
  );
}

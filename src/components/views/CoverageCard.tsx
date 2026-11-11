import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ProgressBar } from "@/components/Progress";
import { planHref as chapterHref } from "@/lib/checklist";
import type { ChapterCoverage, Coverage } from "@/lib/coverage";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * The Final Exam Dashboard's question coverage, in the Study Plan Progress card's place and style.
 * Attempted and not yet attempted split the pool; awaiting review, the latest (self-reported)
 * ratings and the later re-checks overlap them, so they are listed apart and never summed.
 */
export function CoverageCard({ coverage, planHref }: { coverage: { chapters: ChapterCoverage[]; all: Coverage }; planHref: string }) {
  const { chapters, all } = coverage;
  const chapterList = chapters.map((c) => c.chapter).join(", ").replace(/, (\d+)$/, " and $1");
  const rated = all.latest.got_it + all.latest.shaky + all.latest.lost;
  return (
    <section className="card section-gap" aria-labelledby="coverage-title">
      <div className="card-head">
        <h2 id="coverage-title" className="card-title">
          Question Coverage
        </h2>
        <Link className="card-link" href={planHref}>
          View Study Plan <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
      <p className="small text-2" style={{ marginBottom: 16 }}>
        <span className="pill pill-neutral" style={{ marginRight: 8 }}>
          Initial pool
        </span>
        {plural(all.total, "review question")} from Chapters {chapterList}. More may be added.{" "}
        {all.inApp === 0
          ? "None of these questions are in the app yet."
          : all.inApp < all.total
            ? `${all.inApp} of them are in the app so far.`
            : "All of them are in the app."}
      </p>

      <dl className="coverage-stats">
        <div className="coverage-stat">
          <dt>Attempted</dt>
          <dd className="num">{all.attempted}</dd>
        </div>
        <div className="coverage-stat">
          <dt>Not yet attempted</dt>
          <dd className="num">{all.notAttempted}</dd>
        </div>
        <div className="coverage-stat">
          <dt>Awaiting review</dt>
          <dd className="num">{all.awaitingReview}</dd>
        </div>
        <div className="coverage-stat">
          <dt>Checked again later</dt>
          <dd className="num">{all.rechecked}</dd>
        </div>
      </dl>
      <p className="xsmall muted" style={{ marginBottom: 8 }}>
        Attempted and not yet attempted add up to the pool; the other counts overlap them. A question you haven&apos;t tried yet isn&apos;t counted
        as known.
      </p>

      <ul className="list">
        {chapters.map((c) => (
          <li key={c.sectionId}>
            {/* The link's name is its visible text (label in name); where it goes is a description. */}
            <Link className="row-link coverage-link" href={chapterHref(c.sectionId, "core", "final")} aria-describedby={`coverage-opens-${c.sectionId}`}>
              <span className="coverage-body">
                <span className="progress-row">
                  <span className="small" style={{ fontWeight: 600 }}>
                    {c.sectionId} {c.title}
                  </span>
                  <ProgressBar decorative value={c.attempted} max={c.total} label={`Chapter ${c.chapter} ${c.title}: questions attempted`} />
                  <span className="small num" style={{ textAlign: "right" }}>
                    {c.attempted}/{c.total}
                  </span>
                </span>
                <span className="xsmall muted coverage-sub">
                  {c.inApp === 0 ? "Not in the app yet" : `${c.inApp} of ${c.total} in the app`} · {c.awaitingReview} awaiting review · {c.rechecked} checked again later
                </span>
              </span>
              <ChevronRight className="chev" size={18} aria-hidden="true" />
            </Link>
            <span id={`coverage-opens-${c.sectionId}`} hidden>
              Opens Chapter {c.chapter} in the Study Plan. {c.attempted} of {c.total} questions attempted.
            </span>
          </li>
        ))}
      </ul>

      <p className="small text-2" style={{ marginTop: 12 }}>
        <span style={{ fontWeight: 600, color: "var(--text)" }}>Your latest ratings (self-reported): </span>
        {rated === 0 ? "none yet." : `${all.latest.got_it} Got it · ${all.latest.shaky} Shaky · ${all.latest.lost} Lost.`}
      </p>
    </section>
  );
}

"use client";

import { ArrowLeft, ArrowRight, BookOpenCheck, Check, ChevronDown, Eye, Info, Lightbulb, WavesHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { assistAction, openAttemptAction, rateAction } from "@/app/actions/practice";
import type { AttemptState, RateOutcome } from "@/server/practice";
import { NotesBox } from "./NotesBox";

type Rating = "got_it" | "shaky" | "lost";

const RATINGS: Array<{ value: Rating; label: string; sub: string; Icon: typeof Check }> = [
  { value: "got_it", label: "Got it", sub: "I can solve this", Icon: Check },
  { value: "shaky", label: "Shaky", sub: "I need more practice", Icon: WavesHorizontal },
  { value: "lost", label: "Lost", sub: "I need help", Icon: X },
];

export type WorkspaceProps = {
  problemId: string;
  itemId: string | null;
  tag: string;
  statementHtml: string;
  figure: React.ReactNode;
  hintsHtml: string[];
  answerHtml: string;
  steps: Array<{ title: string; html: string }>;
  note: string;
  asideTop: React.ReactNode;
  asideBottom: React.ReactNode;
};

function Html({ html, className = "rich" }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Workspace(props: WorkspaceProps) {
  const { problemId, itemId, hintsHtml, steps } = props;
  const attemptPromise = useRef<Promise<AttemptState | null> | null>(null);
  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [startError, setStartError] = useState(false);

  const [hintOpen, setHintOpen] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [answerOpen, setAnswerOpen] = useState(false);
  const [answerSeen, setAnswerSeen] = useState(false);
  const [solutionSeen, setSolutionSeen] = useState(false);
  const [announce, setAnnounce] = useState("");

  const dialogRef = useRef<HTMLDialogElement>(null);
  const solutionBtn = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  // Step content eases in once the student starts moving between steps (not on first open).
  const [stepMoved, setStepMoved] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const [pending, setPending] = useState<Rating | null>(null);
  const [outcome, setOutcome] = useState<RateOutcome | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);
  const continueRef = useRef<HTMLAnchorElement>(null);

  // Open (or resume) the attempt for this visit. Safe to call twice: the server reuses the open attempt.
  useEffect(() => {
    let alive = true;
    const p = openAttemptAction(problemId, itemId);
    attemptPromise.current = p;
    p.then((a) => {
      if (!alive) return;
      if (!a) {
        setStartError(true);
        return;
      }
      setAttempt(a);
      if (a.hintsShown > 0) setHintsShown((n) => Math.max(n, Math.min(a.hintsShown, hintsHtml.length)));
      if (a.answerRevealed) setAnswerSeen(true);
      if (a.solutionViewed) setSolutionSeen(true);
    }).catch(() => alive && setStartError(true));
    return () => {
      alive = false;
    };
  }, [problemId, itemId, hintsHtml.length]);

  useEffect(() => {
    if (outcome) continueRef.current?.focus();
  }, [outcome]);

  function log(kind: "hint" | "answer" | "solution", n = 1) {
    attemptPromise.current
      ?.then((a) => (a ? assistAction(a.id, kind, n) : undefined))
      .catch(() => undefined);
  }

  function toggleHint() {
    if (hintOpen) {
      setHintOpen(false);
      return;
    }
    const n = Math.max(1, hintsShown);
    setHintsShown(n);
    setHintOpen(true);
    setAnnounce(`Hint ${n} of ${hintsHtml.length} shown below.`);
    log("hint", n);
  }

  function moreHint() {
    const n = Math.min(hintsHtml.length, hintsShown + 1);
    setHintsShown(n);
    setAnnounce(`Hint ${n} of ${hintsHtml.length} shown.`);
    log("hint", n);
  }

  function toggleAnswer() {
    if (answerOpen) {
      setAnswerOpen(false);
      return;
    }
    setAnswerOpen(true);
    setAnswerSeen(true);
    setAnnounce("Answer shown below.");
    log("answer");
  }

  function openSolution() {
    setSolutionSeen(true);
    log("solution");
    dialogRef.current?.showModal();
  }

  function closeSolution() {
    dialogRef.current?.close();
  }

  function goStep(i: number) {
    const s = Math.max(0, Math.min(steps.length - 1, i));
    if (s !== step) setStepMoved(true);
    setStep(s);
    setMaxStep((m) => Math.max(m, s));
  }

  async function rate(value: Rating) {
    if (pending || outcome) return;
    setPending(value);
    setRateError(null);
    try {
      const a = await attemptPromise.current;
      if (!a) {
        setRateError("This problem couldn't be started. Reload the page and try again.");
        return;
      }
      const res = await rateAction(a.id, value);
      if ("error" in res) setRateError(res.error);
      else setOutcome(res);
    } catch {
      setRateError("Your rating wasn't saved. Check your connection and try again.");
    } finally {
      setPending(null);
    }
  }

  const rated = outcome?.rating ?? null;

  return (
    <div className="ws">
      <section className="card" aria-labelledby="problem-heading">
        <div className="cluster" style={{ marginBottom: 12 }}>
          <span className="pill pill-accent">{props.tag}</span>
        </div>
        <h2 id="problem-heading" className="sr-only">
          Problem
        </h2>
        <Html html={props.statementHtml} className="rich statement" />
        {props.figure}
        <p className="tip">
          <Info size={16} aria-hidden="true" />
          Solve on paper first, then use the options below to check your work.
        </p>

        {startError ? (
          <div className="alert alert-error" role="alert" style={{ marginTop: 16 }}>
            We couldn&apos;t start this attempt. Reload the page to try again.
          </div>
        ) : null}

        <div className="assist">
          <button type="button" className="assist-btn" aria-expanded={hintOpen} aria-controls="hint-panel" onClick={toggleHint}>
            <Lightbulb size={18} aria-hidden="true" />
            Get a Hint
            <ChevronDown className="chev" size={18} aria-hidden="true" />
          </button>
          <div id="hint-panel" role="region" aria-label="Hints" className="assist-panel" hidden={!hintOpen}>
            <div className="stack">
              {hintsHtml.slice(0, Math.max(1, hintsShown)).map((h, i) => (
                <div key={i} className="hint-item">
                  <p className="xsmall muted" style={{ marginBottom: 4 }}>
                    Hint {i + 1} of {hintsHtml.length}
                  </p>
                  <Html html={h} />
                </div>
              ))}
              {hintsShown < hintsHtml.length ? (
                <div>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={moreHint}>
                    Show another hint
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <button type="button" className="assist-btn" aria-expanded={answerOpen} aria-controls="answer-panel" onClick={toggleAnswer}>
            <Eye size={18} aria-hidden="true" />
            Reveal Answer
            <ChevronDown className="chev" size={18} aria-hidden="true" />
          </button>
          <div id="answer-panel" role="region" aria-label="Answer" className="assist-panel" hidden={!answerOpen}>
            <Html html={props.answerHtml} />
          </div>

          <button ref={solutionBtn} type="button" className="assist-btn" aria-haspopup="dialog" onClick={openSolution}>
            <BookOpenCheck size={18} aria-hidden="true" />
            Worked Solution (step by step)
            <ArrowRight className="chev" size={18} aria-hidden="true" />
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>

        <div className="rating">
        <fieldset disabled={!!outcome}>
          <legend>How well did you understand this problem?</legend>
          <div className="rating-grid">
            {RATINGS.map((r) => (
              <button
                key={r.value}
                type="button"
                className={`rate-btn rate-${r.value}`}
                aria-pressed={rated ? rated === r.value : undefined}
                disabled={!!pending || !!outcome}
                onClick={() => rate(r.value)}
              >
                <r.Icon size={20} aria-hidden="true" />
                <span>
                  {pending === r.value ? "Saving…" : r.label}
                  <small>{r.sub}</small>
                </span>
              </button>
            ))}
          </div>
        </fieldset>
        </div>
        {rateError ? (
          <div className="alert alert-error" role="alert" style={{ marginTop: 12 }}>
            {rateError}
          </div>
        ) : null}
        {outcome ? (
          <div className="confirm" role="status">
            <p>{outcome.message}</p>
            <div className="cluster">
              <Link ref={continueRef} className="btn btn-primary" href={outcome.nextHref} transitionTypes={["nav-forward"]}>
                {outcome.nextLabel}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              {outcome.rating !== "got_it" ? (
                <Link className="btn btn-ghost" href="/review">
                  View review queue
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <aside className="stack" aria-label="Problem details">
        {props.asideTop}
        <section className="card side-card">
          <NotesBox problemId={problemId} initial={props.note} />
        </section>
        <section className="card side-card" aria-labelledby="attempt-title">
          <h2 id="attempt-title">Attempt Details</h2>
          <dl className="kv">
            <dt>Hints used</dt>
            <dd className="num">{hintsShown > 0 ? `${hintsShown} of ${hintsHtml.length}` : "–"}</dd>
            <dt>Answer viewed</dt>
            <dd>{answerSeen ? "Yes" : "–"}</dd>
            <dt>Solution viewed</dt>
            <dd>{solutionSeen ? "Yes" : "–"}</dd>
            <dt>Rating</dt>
            <dd>{rated ? RATINGS.find((r) => r.value === rated)?.label : attempt ? "Not yet" : "…"}</dd>
          </dl>
        </section>
        {props.asideBottom}
      </aside>

      <dialog
        ref={dialogRef}
        className="sheet"
        aria-labelledby="solution-title"
        onClose={() => {
          solutionBtn.current?.focus();
        }}
      >
        <div className="sheet-head">
          <h2 id="solution-title">Worked Solution</h2>
          <button type="button" className="icon-btn" aria-label="Close worked solution" onClick={closeSolution}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="sheet-body">
          {showAll ? (
            <ol className="list all-steps">
              {steps.map((s, i) => (
                <li key={i}>
                  <h3 className="step-title">
                    Step {i + 1}: {s.title}
                  </h3>
                  <Html html={s.html} />
                </li>
              ))}
            </ol>
          ) : (
            <>
              <ol className="steps-nav" aria-label="Steps">
                {steps.map((s, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className={`step-chip${i <= maxStep ? " seen" : ""}`}
                      aria-current={i === step ? "step" : undefined}
                      onClick={() => goStep(i)}
                    >
                      Step {i + 1}
                    </button>
                  </li>
                ))}
              </ol>
              <div aria-live="polite">
                {/* Keyed so each newly chosen step re-runs its ease-in. */}
                <div key={step} className={stepMoved ? "step-swap" : undefined}>
                  <h3 className="step-title">
                    Step {step + 1}: {steps[step]?.title}
                  </h3>
                  <Html html={steps[step]?.html ?? ""} />
                </div>
              </div>
            </>
          )}
        </div>
        <div className="sheet-foot">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => goStep(step - 1)} disabled={showAll || step === 0}>
            <ArrowLeft size={16} aria-hidden="true" />
            Previous
          </button>
          <span className="small muted num">{showAll ? `All ${steps.length} steps` : `Step ${step + 1} of ${steps.length}`}</span>
          <div className="cluster">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "One step at a time" : "Show full solution"}
            </button>
            {!showAll && step < steps.length - 1 ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => goStep(step + 1)}>
                Next step
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-sm" onClick={closeSolution}>
                Done
              </button>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}

"use client";

import { ChevronUp, Layers, Sprout, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DIFFICULTIES, DIFFICULTY_BLURB, DIFFICULTY_LABEL, type Difficulty } from "@content/types";
import { toggleCheckAction } from "@/app/actions/plan";
import { DifficultyBadge, RatingPill } from "@/components/Badges";
import { ProgressBar } from "@/components/Progress";
import { checklistFor, checklistProgress, difficultyToLevel, levelToDifficulty, planHref, type Level } from "@/lib/checklist";

export type PlanSection = { id: string; title: string; objective: string };
export type PlanProblem = {
  id: string;
  sectionId: string;
  difficulty: Difficulty;
  sort: number;
  active: boolean;
  label: string;
  rating: "got_it" | "shaky" | "lost" | null;
};

const BADGE: Record<Difficulty, string> = { F: "Foundation", C: "Core", Ch: "Challenging" };
const PANEL: Record<Difficulty, { title: string; text: string; Icon: typeof Zap }> = {
  F: { title: "Foundation Problems Only", text: "Introductory problems that build the basics.", Icon: Sprout },
  C: { title: "Core Problems Only", text: "Standard problems that test this section's skills.", Icon: Layers },
  Ch: { title: "Challenging Problems Only", text: "The most difficult / high-yield problems from this section.", Icon: Zap },
};

export function StudyPlanView(props: {
  sections: PlanSection[];
  problems: PlanProblem[];
  checked: string[];
  initialSection: string;
  initialLevel: Level;
}) {
  const { sections, problems } = props;
  const [sectionId, setSectionId] = useState(props.initialSection);
  const [level, setLevel] = useState<Level>(props.initialLevel);
  const [checked, setChecked] = useState(() => new Set(props.checked));
  const [open, setOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const first = useRef(true);

  // Keep the address in step with the two choices, so a reload or a shared link opens the same view.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.history.replaceState(null, "", planHref(sectionId, level));
  }, [sectionId, level]);

  const section = sections.find((s) => s.id === sectionId) ?? sections[0];
  const d = levelToDifficulty(level);
  const list = checklistFor(problems, section.id, level);
  const { done, total, percent } = checklistProgress(list, checked);
  const panel = PANEL[d];

  async function toggle(id: string, next: boolean) {
    setError(null);
    setChecked((prev) => {
      const s = new Set(prev);
      if (next) s.add(id);
      else s.delete(id);
      return s;
    });
    let failed = false;
    try {
      const res = await toggleCheckAction(id, next);
      failed = "error" in res;
    } catch {
      failed = true;
    }
    if (failed) {
      setChecked((prev) => {
        const s = new Set(prev);
        if (next) s.delete(id);
        else s.add(id);
        return s;
      });
      setError("That change wasn't saved. Check your connection and try again.");
    }
  }

  return (
    <>
      <section className="card" aria-label="Choose a difficulty level and a section" style={{ marginBottom: 16 }}>
        <fieldset className="level-select">
          <legend className="sr-only">Difficulty level</legend>
          {DIFFICULTIES.map((x) => (
            <label key={x} className={`level-opt level-opt-${x}`}>
              <input type="radio" name="level" value={x} checked={d === x} onChange={() => setLevel(difficultyToLevel(x))} />
              <DifficultyBadge d={x} />
              <span>{DIFFICULTY_BLURB[x]}</span>
            </label>
          ))}
        </fieldset>
        <fieldset className="sec-row" style={{ marginTop: 16, marginBottom: 0 }}>
          <legend className="sr-only">Section</legend>
          {sections.map((s) => (
            <label key={s.id} className="sec-chip">
              <input type="radio" name="section" value={s.id} checked={section.id === s.id} onChange={() => setSectionId(s.id)} />
              {s.id}
              <span className="sr-only"> {s.title}</span>
            </label>
          ))}
        </fieldset>
      </section>

      <section className="card plan-section" data-level={d} aria-labelledby="plan-section-title">
        <div className="plan-section-head">
          <div className="stack-sm">
            <div className="cluster">
              <h2 id="plan-section-title">
                {section.id} – {section.title}
              </h2>
              <span className="level-badge">
                {d === "Ch" ? <Zap size={13} aria-hidden="true" /> : null}
                {BADGE[d]}
              </span>
            </div>
            <p className="small text-2">{section.objective}</p>
          </div>
          <div className="plan-count">
            <div className="spread small">
              <span className="text-2 num">
                {done}/{total} done
              </span>
              <span className="num" style={{ fontWeight: 700 }}>
                {percent}%
              </span>
            </div>
            <ProgressBar value={done} max={total} label={`${section.id} ${DIFFICULTY_LABEL[d]} progress`} />
          </div>
          <button type="button" className="collapse-btn" aria-expanded={open} aria-controls="plan-section-body" onClick={() => setOpen(!open)}>
            <ChevronUp size={20} aria-hidden="true" />
            <span className="sr-only">{open ? "Collapse" : "Expand"} problems</span>
          </button>
        </div>

        {open ? (
          <div className="plan-section-body" id="plan-section-body">
            <div className="plan-note">
              <panel.Icon size={20} aria-hidden="true" />
              <div>
                <strong>{panel.title}</strong>
                <span className="small text-2">{panel.text}</span>
              </div>
            </div>
            {error ? (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            ) : null}
            {list.length === 0 ? (
              <p className="small text-2">No {DIFFICULTY_LABEL[d]} problems in this section yet.</p>
            ) : (
              <>
                {done === total ? (
                  <p className="small text-2" role="status">
                    All {total} done. Anything you rated Shaky or Lost is in your Review Queue.
                  </p>
                ) : null}
                <ul className="check-list">
                  {list.map((p) => {
                    const on = checked.has(p.id);
                    return (
                      <li key={p.id} className="check-row" data-done={on}>
                        <label className="check-box">
                          <input type="checkbox" checked={on} onChange={(e) => toggle(p.id, e.target.checked)} />
                          <span className="sr-only">{p.label} done</span>
                        </label>
                        <Link className="check-title" href={`/practice/${encodeURIComponent(p.id)}`}>
                          {p.label}
                        </Link>
                        <DifficultyBadge d={p.difficulty} />
                        {p.rating ? (
                          <span className="check-rating">
                            <RatingPill rating={p.rating} />
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        ) : null}
      </section>
    </>
  );
}

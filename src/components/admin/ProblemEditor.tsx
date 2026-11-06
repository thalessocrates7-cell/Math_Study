"use client";

import { ArrowDown, ArrowUp, CircleExclamationPoint, Plus, Trash } from "lucide-react";
import { useActionState, useDeferredValue, useState } from "react";
import type { Difficulty, Step } from "@content/types";
import { DIFFICULTIES, DIFFICULTY_LABEL } from "@content/types";
import { saveProblemAction, type ProblemState } from "@/app/actions/admin";
import { renderRich } from "@/lib/tex";

export type EditorSection = { id: string; title: string; concepts: Array<{ id: string; label: string }> };
export type EditorProblem = {
  id: string;
  sectionId: string;
  openstaxNumber: number | null;
  difficulty: Difficulty;
  concepts: string[];
  statement: string;
  hints: string[];
  answer: string;
  steps: Step[];
  active: boolean;
};

function Preview({ src }: { src: string }) {
  const deferred = useDeferredValue(src);
  return <div className="rich" dangerouslySetInnerHTML={{ __html: renderRich(deferred) }} />;
}

export function ProblemEditor({ mode, initial, sections }: { mode: "create" | "update"; initial: EditorProblem; sections: EditorSection[] }) {
  const [p, setP] = useState<EditorProblem>(initial);
  const [state, action, pending] = useActionState<ProblemState, FormData>(saveProblemAction, {});
  const section = sections.find((s) => s.id === p.sectionId);
  const set = <K extends keyof EditorProblem>(k: K, v: EditorProblem[K]) => setP((prev) => ({ ...prev, [k]: v }));

  const moveStep = (i: number, dir: -1 | 1) =>
    setP((prev) => {
      const steps = [...prev.steps];
      const j = i + dir;
      if (j < 0 || j >= steps.length) return prev;
      [steps[i], steps[j]] = [steps[j], steps[i]];
      return { ...prev, steps };
    });

  return (
    <form action={action} className="editor">
      <input type="hidden" name="payload" value={JSON.stringify({ ...p, mode })} />
      <div className="stack">
        {state.error ? (
          <div className="alert alert-error" role="alert">
            <CircleExclamationPoint size={18} aria-hidden="true" />
            <span>{state.error}</span>
          </div>
        ) : null}
        <section className="card stack" aria-labelledby="meta-title">
          <h2 id="meta-title" className="card-title" style={{ margin: 0 }}>
            Details
          </h2>
          <div className="grid grid-2">
            <div className="field">
              <label className="label" htmlFor="pe-section">
                Section
              </label>
              <select
                id="pe-section"
                className="select"
                value={p.sectionId}
                disabled={mode === "update"}
                onChange={(e) => {
                  const id = e.target.value;
                  setP((prev) => ({ ...prev, sectionId: id, concepts: [], id: mode === "create" ? `${id}-${prev.id.split("-")[1] ?? "o1"}` : prev.id }));
                }}
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="pe-id">
                Problem ID
              </label>
              <input
                id="pe-id"
                className="input"
                value={p.id}
                readOnly={mode === "update"}
                aria-describedby="pe-id-hint"
                onChange={(e) => set("id", e.target.value.trim())}
              />
              <span id="pe-id-hint" className="field-hint">
                {mode === "update" ? "IDs can't change once students may have seen the problem." : "Section, a dash, then the exercise number or a code like o5."}
              </span>
            </div>
            <div className="field">
              <label className="label" htmlFor="pe-difficulty">
                Difficulty
              </label>
              <select id="pe-difficulty" className="select" value={p.difficulty} onChange={(e) => set("difficulty", e.target.value as Difficulty)}>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {DIFFICULTY_LABEL[d]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="pe-openstax">
                OpenStax exercise number
              </label>
              <input
                id="pe-openstax"
                className="input"
                inputMode="numeric"
                value={p.openstaxNumber ?? ""}
                placeholder="Leave empty for an original problem"
                onChange={(e) => set("openstaxNumber", e.target.value === "" ? null : Number(e.target.value.replace(/\D/g, "")))}
              />
            </div>
          </div>
          <fieldset>
            <legend className="label" style={{ marginBottom: 6 }}>
              Concepts (used to pick similar and easier problems)
            </legend>
            <div className="grid grid-2" style={{ gap: 4 }}>
              {(section?.concepts ?? []).map((c) => (
                <label key={c.id} className="checkbox">
                  <input
                    type="checkbox"
                    checked={p.concepts.includes(c.id)}
                    onChange={(e) => set("concepts", e.target.checked ? [...p.concepts, c.id] : p.concepts.filter((x) => x !== c.id))}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="checkbox">
            <input type="checkbox" checked={p.active} onChange={(e) => set("active", e.target.checked)} />
            Active (retired problems are removed from study plans; history is kept)
          </label>
        </section>

        <section className="card stack" aria-labelledby="content-title">
          <h2 id="content-title" className="card-title" style={{ margin: 0 }}>
            Content
          </h2>
          <p className="field-hint">
            Write math in TeX: inline <code>$x^2$</code>, display <code>$$\int_0^1 x\,dx$$</code>, a literal dollar as <code>\$</code>. Lines
            starting with <code>|</code> make a table.
          </p>
          <div className="field">
            <label className="label" htmlFor="pe-statement">
              Problem statement
            </label>
            <textarea id="pe-statement" className="textarea mono" rows={5} value={p.statement} onChange={(e) => set("statement", e.target.value)} />
          </div>
          <div className="field">
            <label className="label" htmlFor="pe-answer">
              Answer
            </label>
            <textarea id="pe-answer" className="textarea mono" rows={2} value={p.answer} onChange={(e) => set("answer", e.target.value)} />
          </div>
          <fieldset className="stack-sm">
            <legend className="label" style={{ marginBottom: 6 }}>
              Hints (shown one at a time)
            </legend>
            {p.hints.map((h, i) => (
              <div key={i} className="cluster" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
                <textarea
                  aria-label={`Hint ${i + 1}`}
                  className="textarea mono"
                  rows={2}
                  value={h}
                  onChange={(e) => set("hints", p.hints.map((x, j) => (j === i ? e.target.value : x)))}
                />
                <button type="button" className="icon-btn" aria-label={`Remove hint ${i + 1}`} onClick={() => set("hints", p.hints.filter((_, j) => j !== i))}>
                  <Trash size={18} aria-hidden="true" />
                </button>
              </div>
            ))}
            <div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => set("hints", [...p.hints, ""])}>
                <Plus size={16} aria-hidden="true" />
                Add hint
              </button>
            </div>
          </fieldset>
          <fieldset className="stack-sm">
            <legend className="label" style={{ marginBottom: 6 }}>
              Worked solution steps
            </legend>
            {p.steps.map((s, i) => (
              <div key={i} className="step-editor">
                <div className="spread">
                  <strong className="small">Step {i + 1}</strong>
                  <div className="cluster" style={{ gap: 0 }}>
                    <button type="button" className="icon-btn" aria-label={`Move step ${i + 1} up`} disabled={i === 0} onClick={() => moveStep(i, -1)}>
                      <ArrowUp size={18} aria-hidden="true" />
                    </button>
                    <button type="button" className="icon-btn" aria-label={`Move step ${i + 1} down`} disabled={i === p.steps.length - 1} onClick={() => moveStep(i, 1)}>
                      <ArrowDown size={18} aria-hidden="true" />
                    </button>
                    <button type="button" className="icon-btn" aria-label={`Remove step ${i + 1}`} onClick={() => set("steps", p.steps.filter((_, j) => j !== i))}>
                      <Trash size={18} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <input
                  aria-label={`Step ${i + 1} title`}
                  className="input"
                  placeholder="Short title, e.g. Find an antiderivative"
                  value={s.title}
                  onChange={(e) => set("steps", p.steps.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                />
                <textarea
                  aria-label={`Step ${i + 1} explanation`}
                  className="textarea mono"
                  rows={3}
                  value={s.body}
                  onChange={(e) => set("steps", p.steps.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))}
                />
              </div>
            ))}
            <div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => set("steps", [...p.steps, { title: "", body: "" }])}>
                <Plus size={16} aria-hidden="true" />
                Add step
              </button>
            </div>
          </fieldset>
        </section>
        <div className="cluster">
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? "Saving…" : mode === "create" ? "Create problem" : "Save changes"}
          </button>
        </div>
      </div>

      <section className="card preview-pane stack" aria-labelledby="preview-title">
        <h2 id="preview-title" className="card-title" style={{ margin: 0 }}>
          Student preview
        </h2>
        <div className="statement">
          <Preview src={p.statement} />
        </div>
        <div>
          <h3 className="small muted">Hints</h3>
          {p.hints.map((h, i) => (
            <div key={i} style={{ marginTop: 6 }}>
              <Preview src={h} />
            </div>
          ))}
        </div>
        <div>
          <h3 className="small muted">Answer</h3>
          <Preview src={p.answer} />
        </div>
        <ol className="list all-steps">
          {p.steps.map((s, i) => (
            <li key={i}>
              <h3 className="step-title">
                Step {i + 1}: {s.title}
              </h3>
              <Preview src={s.body} />
            </li>
          ))}
        </ol>
      </section>
    </form>
  );
}

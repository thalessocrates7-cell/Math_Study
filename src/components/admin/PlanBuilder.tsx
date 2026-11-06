"use client";

import { CircleExclamationPoint } from "lucide-react";
import { useActionState, useState } from "react";
import type { Difficulty } from "@content/types";
import { savePlanAction, type PlanState } from "@/app/actions/admin";

export type BuilderRow = { sectionId: string; title: string; counts: Record<Difficulty, number>; pool: Record<Difficulty, number> };

const LEVELS: Array<{ d: Difficulty; label: string }> = [
  { d: "F", label: "Foundation" },
  { d: "C", label: "Core" },
  { d: "Ch", label: "Challenge" },
];

export function PlanBuilder({ rows }: { rows: BuilderRow[] }) {
  const [state, action, pending] = useActionState<PlanState, FormData>(savePlanAction, {});
  const [values, setValues] = useState<Record<string, Record<Difficulty, number>>>(
    Object.fromEntries(rows.map((r) => [r.sectionId, { ...r.counts }])),
  );

  const setValue = (id: string, d: Difficulty, v: number) => setValues((prev) => ({ ...prev, [id]: { ...prev[id], [d]: v } }));

  const applyDefault = () =>
    setValues(
      Object.fromEntries(
        rows.map((r) => {
          const fits = r.pool.F >= 5 && r.pool.C >= 7 && r.pool.Ch >= 3;
          const pick = fits ? { F: 5, C: 7, Ch: 3 } : { F: Math.min(3, r.pool.F), C: Math.min(5, r.pool.C), Ch: Math.min(2, r.pool.Ch) };
          return [r.sectionId, pick];
        }),
      ),
    );

  return (
    <form action={action} className="stack" noValidate>
      {state.error ? (
        <div className="alert alert-error" role="alert">
          <CircleExclamationPoint size={18} aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      ) : null}
      {state.ok ? (
        <div className="alert alert-success" role="status">
          Plan saved.{state.rebalanced ? ` Updated ${state.rebalanced} existing student plan${state.rebalanced === 1 ? "" : "s"}.` : " New students get these counts."}
        </div>
      ) : null}
      <div className="table-wrap">
        {/* On phones each row stacks (section name, then the three counts); see .plan-table in app.css. */}
        <table className="table plan-table">
          <thead>
            <tr>
              <th scope="col">Section</th>
              {LEVELS.map((l) => (
                <th key={l.d} scope="col">
                  {l.label}
                </th>
              ))}
              <th scope="col" className="numcol">
                Total
              </th>
              <th scope="col" style={{ minWidth: 140 }}>
                Mix
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const v = values[r.sectionId];
              const total = v.F + v.C + v.Ch;
              return (
                <tr key={r.sectionId}>
                  <th scope="row" style={{ fontWeight: 600 }}>
                    {r.sectionId} {r.title}
                  </th>
                  {LEVELS.map((l) => (
                    <td key={l.d}>
                      <label className="sr-only" htmlFor={`${r.sectionId}:${l.d}`}>
                        {r.sectionId} {l.label} problems (up to {r.pool[l.d]})
                      </label>
                      <span className="plan-level" aria-hidden="true">
                        {l.label}
                      </span>
                      <input
                        id={`${r.sectionId}:${l.d}`}
                        name={`${r.sectionId}:${l.d}`}
                        className="input plan-count"
                        type="number"
                        min={0}
                        max={r.pool[l.d]}
                        step={1}
                        value={v[l.d]}
                        onChange={(e) => setValue(r.sectionId, l.d, Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                      />
                      <div className="xsmall muted num">of {r.pool[l.d]}</div>
                    </td>
                  ))}
                  <td className="numcol plan-total">
                    <span className="plan-level" aria-hidden="true">
                      Total
                    </span>
                    {total}
                  </td>
                  <td className="plan-mix">
                    <div className="mix" aria-hidden="true">
                      {LEVELS.map((l) => (v[l.d] > 0 ? <span key={l.d} className={`mix-${l.d}`} style={{ flexGrow: v[l.d], flexBasis: 0 }} /> : null))}
                    </div>
                    <span className="sr-only">
                      {v.F} Foundation, {v.C} Core, {v.Ch} Challenge
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <label className="checkbox">
        <input type="checkbox" name="updateExisting" />
        Also update existing students&apos; plans (problems they already worked always stay in their plan)
      </label>
      <div className="cluster">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save plan"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={applyDefault}>
          Use defaults (5 / 7 / 3)
        </button>
      </div>
    </form>
  );
}

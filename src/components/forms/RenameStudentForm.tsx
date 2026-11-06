"use client";

import { CircleExclamationPoint } from "lucide-react";
import { useActionState } from "react";
import { mergeStudentAction, renameStudentAction, type RenameState } from "@/app/actions/admin";

export function RenameStudentForm({ id, first, last }: { id: string; first: string; last: string }) {
  const [state, action, pending] = useActionState<RenameState, FormData>(renameStudentAction, {});
  return (
    <div className="stack">
      <form action={action} className="stack">
        <input type="hidden" name="id" value={id} />
        <div className="grid grid-2">
          <div className="field">
            <label className="label" htmlFor="rename-first">
              First name
            </label>
            <input id="rename-first" name="first" className="input" defaultValue={first} maxLength={40} required />
          </div>
          <div className="field">
            <label className="label" htmlFor="rename-last">
              Last name
            </label>
            <input id="rename-last" name="last" className="input" defaultValue={last} maxLength={40} required />
          </div>
        </div>
        <div className="cluster">
          <button className="btn btn-secondary" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save name"}
          </button>
          <span className="small" role="status">
            {state.ok ? "Name saved." : ""}
          </span>
        </div>
      </form>
      {state.error ? (
        <div className="alert alert-error" role="alert">
          <CircleExclamationPoint size={18} aria-hidden="true" />
          <div className="stack-sm">
            <span>{state.error}</span>
            {state.conflict ? (
              <form action={mergeStudentAction}>
                <input type="hidden" name="source" value={id} />
                <input type="hidden" name="target" value={state.conflict.id} />
                <p className="small" style={{ marginBottom: 8 }}>
                  If they are the same person, merge this account into {state.conflict.name}. History, reviews and notes move over; this account
                  is then deleted.
                </p>
                <button className="btn btn-danger btn-sm" type="submit">
                  Merge into {state.conflict.name}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

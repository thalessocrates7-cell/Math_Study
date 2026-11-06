"use client";

import { CircleExclamationPoint } from "lucide-react";
import { useActionState } from "react";
import { saveSettingsAction, type SettingsState } from "@/app/actions/admin";

export function SettingsForm({ examName, examDate }: { examName: string; examDate: string }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettingsAction, {});
  return (
    <form action={action} className="stack">
      {state.error ? (
        <div className="alert alert-error" role="alert">
          <CircleExclamationPoint size={18} aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      ) : null}
      <div className="grid grid-2">
        <div className="field">
          <label className="label" htmlFor="examName">
            Exam name
          </label>
          <input id="examName" name="examName" className="input" defaultValue={examName} maxLength={60} required />
        </div>
        <div className="field">
          <label className="label" htmlFor="examDate">
            Exam date
          </label>
          <input id="examDate" name="examDate" type="date" className="input" defaultValue={examDate} required />
        </div>
      </div>
      <div className="cluster">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
        <span className="small" role="status">
          {state.ok ? "Saved. Students see the new countdown right away." : ""}
        </span>
      </div>
    </form>
  );
}

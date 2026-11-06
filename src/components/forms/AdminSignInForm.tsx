"use client";

import { ArrowRight, CircleExclamationPoint, KeyRound } from "lucide-react";
import { useActionState } from "react";
import { adminSignIn, type AdminSignInState } from "@/app/actions/auth";

export function AdminSignInForm() {
  const [state, action, pending] = useActionState<AdminSignInState, FormData>(adminSignIn, {});
  return (
    <form action={action} className="stack" aria-labelledby="admin-title">
      {state.error ? (
        <div id="admin-error" className="alert alert-error" role="alert">
          <CircleExclamationPoint size={18} aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      ) : null}
      <div className="field">
        <label className="label" htmlFor="code">
          Access Code
        </label>
        <div className="input-wrap">
          <KeyRound size={18} aria-hidden="true" />
          <input
            id="code"
            name="code"
            type="password"
            className="input"
            placeholder="Enter access code"
            autoComplete="current-password"
            required
            autoFocus
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "admin-error" : undefined}
          />
        </div>
      </div>
      <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={pending}>
        {pending ? "Checking…" : "Sign In"}
        {pending ? null : <ArrowRight size={18} aria-hidden="true" />}
      </button>
    </form>
  );
}

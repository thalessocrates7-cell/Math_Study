"use client";

import { ArrowRight, CircleExclamationPoint, User } from "lucide-react";
import { useActionState } from "react";
import { signIn, type SignInState } from "@/app/actions/auth";

export function SignInForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});
  const firstBad = state.field === "first" || state.field === "both";
  const lastBad = state.field === "last" || state.field === "both";

  return (
    <form action={action} className="stack" aria-labelledby="signin-title" noValidate>
      {state.error ? (
        <div id="signin-error" className="alert alert-error" role="alert">
          <CircleExclamationPoint size={18} aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      ) : null}
      <div className="field">
        <label className="label" htmlFor="first">
          First Name
        </label>
        <div className="input-wrap">
          <User size={18} aria-hidden="true" />
          <input
            id="first"
            name="first"
            className="input"
            placeholder="Enter your first name"
            autoComplete="given-name"
            autoCapitalize="words"
            maxLength={40}
            required
            autoFocus
            defaultValue={state.values?.first}
            aria-invalid={firstBad || undefined}
            aria-describedby={firstBad ? "signin-error" : undefined}
          />
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="last">
          Last Name
        </label>
        <div className="input-wrap">
          <User size={18} aria-hidden="true" />
          <input
            id="last"
            name="last"
            className="input"
            placeholder="Enter your last name"
            autoComplete="family-name"
            autoCapitalize="words"
            maxLength={40}
            required
            defaultValue={state.values?.last}
            aria-invalid={lastBad || undefined}
            aria-describedby={lastBad ? "signin-error" : undefined}
          />
        </div>
      </div>
      <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={pending}>
        {pending ? "Opening your plan…" : "Continue"}
        {pending ? null : <ArrowRight size={18} aria-hidden="true" />}
      </button>
      <p className="small muted" style={{ textAlign: "center" }}>
        New student? Your account will be created automatically.
      </p>
    </form>
  );
}

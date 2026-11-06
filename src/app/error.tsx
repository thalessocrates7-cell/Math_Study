"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="auth">
      <div className="auth-inner">
        <section className="card empty" role="alert">
          <h1>Something went wrong</h1>
          <p className="text-2">Your progress is saved after every rating. Try again, or go back to your dashboard.</p>
          <div className="cluster" style={{ justifyContent: "center" }}>
            <button className="btn btn-primary" type="button" onClick={() => reset()}>
              Try again
            </button>
            <Link className="btn btn-secondary" href="/dashboard">
              Dashboard
            </Link>
          </div>
          {error.digest ? <p className="xsmall muted">Error reference: {error.digest}</p> : null}
        </section>
      </div>
    </main>
  );
}

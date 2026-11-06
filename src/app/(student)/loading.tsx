import { ViewTransition } from "react";

export default function Loading() {
  return (
    // The skeleton fades out when the page arrives (the page itself fades in; see PageTransition).
    <ViewTransition exit="page-exit" default="none">
      <div className="page" aria-busy="true" aria-live="polite">
        <p className="sr-only">Loading…</p>
        <div className="stack">
          <div className="card skeleton" style={{ height: 96 }} />
          <div className="grid grid-2">
            <div className="card skeleton" style={{ height: 220 }} />
            <div className="card skeleton" style={{ height: 220 }} />
          </div>
        </div>
      </div>
    </ViewTransition>
  );
}

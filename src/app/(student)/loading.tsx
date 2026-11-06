export default function Loading() {
  return (
    <div className="page" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading…</p>
      <div className="stack">
        <div className="card" style={{ height: 96, opacity: 0.6 }} />
        <div className="grid grid-2">
          <div className="card" style={{ height: 220, opacity: 0.6 }} />
          <div className="card" style={{ height: 220, opacity: 0.6 }} />
        </div>
      </div>
    </div>
  );
}

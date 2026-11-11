/**
 * A progress bar. `decorative` hides it from assistive technology: use it when the same numbers
 * are written next to it as text, e.g. inside a link, so the bar's own label doesn't end up in the link's name.
 */
export function ProgressBar({ value, max, label, decorative = false }: { value: number; max: number; label: string; decorative?: boolean }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  if (decorative) {
    return (
      <div className="progress" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    );
  }
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value} of ${max} (${pct}%)`}
    >
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ProgressRing({ value, max, label, size = 56 }: { value: number; max: number; label: string; size?: number }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg
      className="ring"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sunken)" strokeWidth={stroke} />
      {pct > 0 ? (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--chart-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      ) : null}
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={size / 4.2}>
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

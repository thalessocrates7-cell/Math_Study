import Link from "next/link";
import { formatShortWeekday } from "@/lib/dates";

type Counts = { got: number; shaky: number; lost: number; new: number };

const SERIES: Array<{ key: keyof Counts; label: string }> = [
  { key: "got", label: "Got it" },
  { key: "shaky", label: "Shaky" },
  { key: "lost", label: "Lost" },
  { key: "new", label: "Not started" },
];

export function RatingLegend({ includeNew = true }: { includeNew?: boolean }) {
  return (
    <ul className="chart-legend" aria-label="Legend">
      {SERIES.filter((s) => includeNew || s.key !== "new").map((s) => (
        <li key={s.key}>
          <span className={`swatch sw-${s.key}`} aria-hidden="true" />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

/** One stacked bar per section (latest rating of each planned problem), with a table view. */
export function SectionBars({
  rows,
  caption,
  includeNew = true,
}: {
  rows: Array<Counts & { id: string; label: string; href?: string; valueText?: string }>;
  caption: string;
  includeNew?: boolean;
}) {
  return (
    <div>
      <RatingLegend includeNew={includeNew} />
      <ul className="bar-rows">
        {rows.map((r) => {
          const total = r.got + r.shaky + r.lost + r.new;
          const done = total - r.new;
          return (
            <li key={r.id} className="bar-row">
              <span className="bar-label">{r.href ? <Link href={r.href}>{r.label}</Link> : r.label}</span>
              <div className="stacked" aria-hidden="true">
                {SERIES.map((s) =>
                  r[s.key] > 0 ? (
                    <span key={s.key} className={`seg seg-${s.key}`} style={{ flexGrow: r[s.key], flexBasis: 0 }} title={`${s.label}: ${r[s.key]}`} />
                  ) : null,
                )}
              </div>
              <span className="bar-value">{r.valueText ?? `${done}/${total} done`}</span>
            </li>
          );
        })}
      </ul>
      <details className="table-view">
        <summary>Show as a table</summary>
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr>
                <th scope="col">Section</th>
                {SERIES.filter((s) => includeNew || s.key !== "new").map((s) => (
                  <th key={s.key} scope="col" className="numcol">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <th scope="row">{r.label}</th>
                  {SERIES.filter((s) => includeNew || s.key !== "new").map((s) => (
                    <td key={s.key} className="numcol">
                      {r[s.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/** Share of Got it / Shaky / Lost among rated problems. */
export function RatingDonut({ got, shaky, lost }: { got: number; shaky: number; lost: number }) {
  const total = got + shaky + lost;
  const size = 148;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const parts = [
    { key: "got", label: "Got it", value: got },
    { key: "shaky", label: "Shaky", value: shaky },
    { key: "lost", label: "Lost", value: lost },
  ];
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const nonZero = parts.filter((p) => p.value > 0).length;
  const gap = nonZero > 1 ? 3 : 0;
  let offset = 0;
  const summary = total
    ? `You rated ${pct(got)}% of your problems Got it, ${pct(shaky)}% Shaky and ${pct(lost)}% Lost.`
    : "No ratings yet.";
  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={summary}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--chart-new)" strokeWidth={stroke} />
        {total > 0 &&
          parts.map((p) => {
            const len = (p.value / total) * c;
            const dash = Math.max(0, len - gap);
            const el =
              p.value > 0 ? (
                <circle
                  key={p.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={`var(--chart-${p.key})`}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-offset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                >
                  <title>{`${p.label}: ${p.value} (${pct(p.value)}%)`}</title>
                </circle>
              ) : null;
            offset += len;
            return el;
          })}
        <text className="donut-center" x="50%" y="47%" textAnchor="middle" dominantBaseline="central">
          {total ? `${pct(got)}%` : "–"}
        </text>
        <text className="donut-sub" x="50%" y="62%" textAnchor="middle" dominantBaseline="central">
          Got it
        </text>
      </svg>
      <div className="stack-sm">
        <ul className="legend-list">
          {parts.map((p) => (
            <li key={p.key}>
              <span className={`swatch sw-${p.key}`} aria-hidden="true" />
              <span>
                {p.label}: <strong className="num">{p.value}</strong> <span className="muted num">({pct(p.value)}%)</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="small text-2">{summary}</p>
      </div>
    </div>
  );
}

/** Problems rated per day for the last 14 days. */
export function ActivityColumns({ data }: { data: Array<{ day: string; count: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((m, d) => m + d.count, 0);
  const label = `${total} problem${total === 1 ? "" : "s"} rated in the last 14 days.`;
  return (
    <figure style={{ margin: 0 }}>
      <div className="cols" role="img" aria-label={label}>
        {total === 0 ? <span className="cols-empty">Problems you rate will show up here, one bar per day.</span> : null}
        {data.map((d) => (
          <span
            key={d.day}
            className={d.count ? "col" : "col col-zero"}
            style={{ height: d.count ? `${Math.max(6, (d.count / max) * 100)}%` : undefined }}
            title={`${formatShortWeekday(d.day)}: ${d.count} rated`}
          />
        ))}
      </div>
      <div className="col-labels" aria-hidden="true">
        {data.map((d, i) => (
          <span key={d.day}>{i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2) ? Number(d.day.slice(8)) : ""}</span>
        ))}
      </div>
      <figcaption className="small text-2" style={{ marginTop: 8 }}>
        {label}
      </figcaption>
    </figure>
  );
}

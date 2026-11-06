import type { PlotSpec } from "@content/types";

const W = 560;
const PAD = { l: 36, r: 14, t: 14, b: 28 };

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** Accessible SVG graph for a problem figure. Points are precomputed in the content files. */
export function FunctionPlot({ spec }: { spec: PlotSpec }) {
  const plotW = W - PAD.l - PAD.r;
  const xr = spec.xMax - spec.xMin;
  const yr = spec.yMax - spec.yMin;
  const plotH = spec.aspect === "equal" ? (plotW * yr) / xr : plotW * (typeof spec.aspect === "number" ? spec.aspect : 0.6);
  const H = plotH + PAD.t + PAD.b;
  const sx = (x: number) => PAD.l + ((x - spec.xMin) / xr) * plotW;
  const sy = (y: number) => PAD.t + ((spec.yMax - y) / yr) * plotH;
  const axisY = spec.yMin <= 0 && spec.yMax >= 0 ? sy(0) : sy(spec.yMin);
  const axisX = spec.xMin <= 0 && spec.xMax >= 0 ? sx(0) : sx(spec.xMin);
  const xTicks = spec.xTicks ?? [];
  const yTicks = spec.yTicks ?? [];

  return (
    <figure className="plot">
      <svg viewBox={`0 0 ${W} ${Math.round(H)}`} role="img" aria-label={spec.alt}>
        {xTicks.map((x) => (
          <line key={`gx${x}`} className="gridline" x1={sx(x)} x2={sx(x)} y1={PAD.t} y2={PAD.t + plotH} />
        ))}
        {yTicks.map((y) => (
          <line key={`gy${y}`} className="gridline" x1={PAD.l} x2={PAD.l + plotW} y1={sy(y)} y2={sy(y)} />
        ))}
        {spec.curves.map((c, i) =>
          c.shade && c.points.length > 1 ? (
            <polygon
              key={`s${i}`}
              className="shade"
              points={[
                `${sx(c.points[0][0])},${sy(0)}`,
                ...c.points.map(([x, y]) => `${sx(x)},${sy(y)}`),
                `${sx(c.points[c.points.length - 1][0])},${sy(0)}`,
              ].join(" ")}
            />
          ) : null,
        )}
        {(spec.rects ?? []).map((r, i) => (
          <rect
            key={`r${i}`}
            className="rect"
            x={sx(r.x)}
            width={sx(r.x + r.w) - sx(r.x)}
            y={r.h >= 0 ? sy(r.h) : sy(0)}
            height={Math.abs(sy(r.h) - sy(0))}
          />
        ))}
        <line className="axis" x1={PAD.l} x2={PAD.l + plotW} y1={axisY} y2={axisY} />
        <line className="axis" x1={axisX} x2={axisX} y1={PAD.t} y2={PAD.t + plotH} />
        {spec.curves.map((c, i) => (
          <polyline key={`c${i}`} className="curve" points={c.points.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ")} />
        ))}
        {(spec.dots ?? []).map(([x, y], i) => (
          <circle key={`d${i}`} className="dot" cx={sx(x)} cy={sy(y)} r={4} />
        ))}
        {xTicks.map((x) => (
          <text key={`tx${x}`} className="tick" x={sx(x)} y={Math.min(axisY + 16, PAD.t + plotH + 18)} textAnchor="middle">
            {fmt(x)}
          </text>
        ))}
        {yTicks.map((y) => (
          <text key={`ty${y}`} className="tick" x={Math.max(axisX - 6, 10)} y={sy(y) + 4} textAnchor="end">
            {fmt(y)}
          </text>
        ))}
      </svg>
    </figure>
  );
}

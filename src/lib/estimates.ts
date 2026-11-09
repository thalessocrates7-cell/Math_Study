/**
 * Time estimates. A problem starts at the admin's estimate (or the default for its difficulty), blends
 * toward the class's typical time once enough students have solved it, and is then scaled by each
 * student's own speed factor. Going over time is never penalized; it only teaches the estimates.
 */
import type { Difficulty } from "../../content/types";
import type { Rules } from "./rules";

export type TimeStats = { n: number; sumLogSeconds: number };

export function baseMinutes(p: { difficulty: Difficulty; estMinutes: number | null }, rules: Rules): number {
  return p.estMinutes && p.estMinutes > 0 ? p.estMinutes : rules.minutes[p.difficulty];
}

/** The estimate after blending toward the class's geometric-mean time (needs `classMin` students). */
export function refinedMinutes(base: number, stats: TimeStats | undefined, rules: Rules): number {
  const k = rules.timing.classMin;
  if (!stats || stats.n < k || stats.n <= 0) return base;
  const classMinutes = Math.exp(stats.sumLogSeconds / stats.n) / 60;
  return (k * base + stats.n * classMinutes) / (k + stats.n);
}

/** A measured time made safe for statistics: null if too short to mean anything, else clamped. */
export function usableSeconds(seconds: number, estimateMinutes: number, rules: Rules): number | null {
  if (!Number.isFinite(seconds) || seconds < rules.timing.minSeconds) return null;
  return Math.min(seconds, estimateMinutes * 60 * rules.timing.maxFactor);
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * How a student's times compare with the estimates: the median of their recent actual/estimate
 * ratios, pulled toward 1 while there are few samples, and kept within [speedMin, speedMax].
 * `samples` should be most recent first.
 */
export function speedFactor(samples: Array<{ seconds: number; estimateMinutes: number }>, rules: Rules): { factor: number; n: number } {
  const ratios: number[] = [];
  for (const s of samples) {
    if (ratios.length >= rules.timing.speedSamples) break;
    const sec = usableSeconds(s.seconds, s.estimateMinutes, rules);
    if (sec === null || s.estimateMinutes <= 0) continue;
    ratios.push(Math.min(4, Math.max(0.25, sec / 60 / s.estimateMinutes)));
  }
  if (ratios.length === 0) return { factor: 1, n: 0 };
  const n = ratios.length;
  const shrunk = Math.exp((n * Math.log(median(ratios))) / (n + rules.timing.speedPrior));
  return { factor: Math.min(rules.timing.speedMax, Math.max(rules.timing.speedMin, shrunk)), n };
}

/** Whole minutes for this student, at least 1. */
export function personalMinutes(refined: number, factor: number): number {
  return Math.max(1, Math.round(refined * factor));
}

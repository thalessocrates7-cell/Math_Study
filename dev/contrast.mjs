// Checks WCAG contrast for every text/background and UI pair defined in src/styles/tokens.css,
// in both themes. Run: node dev/contrast.mjs   (exit 1 on any failure)
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const tokens = { light: {}, dark: {} };
for (const m of css.matchAll(/--([\w-]+):\s*light-dark\(\s*(#[0-9a-fA-F]{6})\s*,\s*(#[0-9a-fA-F]{6})\s*\)/g)) {
  tokens.light[m[1]] = m[2];
  tokens.dark[m[1]] = m[3];
}

function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const TEXT = 4.5;
const UI = 3;
const pairs = [
  ...["text", "text-2", "muted"].flatMap((fg) => ["bg", "surface", "surface-2"].map((bg) => [fg, bg, TEXT])),
  ["accent-text", "surface", TEXT],
  ["accent-text", "bg", TEXT],
  ["on-accent", "accent", TEXT],
  ["on-accent", "accent-hover", TEXT],
  ["on-accent", "accent-active", TEXT],
  ["accent-soft-text", "accent-soft", TEXT],
  ["success-text", "success-soft", TEXT],
  ["success-text", "surface", TEXT],
  ["warning-text", "warning-soft", TEXT],
  ["warning-text", "surface", TEXT],
  ["danger-text", "danger-soft", TEXT],
  ["danger-text", "surface", TEXT],
  ["diff-f", "diff-f-soft", TEXT],
  ["diff-c", "diff-c-soft", TEXT],
  ["diff-ch", "diff-ch-soft", TEXT],
  ["diff-f", "surface", TEXT],
  ["diff-c", "surface", TEXT],
  ["diff-ch", "surface", TEXT],
  ["border-strong", "surface", UI],
  ["border-strong", "bg", UI],
  ["focus-ring", "surface", UI],
  ["focus-ring", "bg", UI],
  ["chart-accent", "bg", UI],
  ["chart-accent", "sunken", UI],
  ["success-icon", "surface", UI],
  ["warning-icon", "surface", UI],
  ["danger-icon", "surface", UI],
  ["chart-got", "surface", UI],
  ["chart-accent", "surface", UI],
  // Active-nav marker drawn on the active item's pill.
  ["chart-accent", "accent-soft", UI],
  // Study sessions: "Keep going" pills and step numbers, the timer total, the Paused icon.
  ["text-2", "sunken", TEXT],
  ["text", "sunken", TEXT],
  ["success-text", "sunken", UI],
  ["accent-text", "surface-2", UI],
];

let failures = 0;
for (const mode of ["light", "dark"]) {
  console.log(`\n${mode.toUpperCase()}`);
  for (const [fg, bg, min] of pairs) {
    const a = tokens[mode][fg];
    const b = tokens[mode][bg];
    if (!a || !b) {
      console.log(`  MISSING ${fg} on ${bg}`);
      failures++;
      continue;
    }
    const r = ratio(a, b);
    const ok = r >= min;
    if (!ok) failures++;
    console.log(`  ${ok ? "ok  " : "FAIL"} ${fg.padEnd(16)} on ${bg.padEnd(12)} ${r.toFixed(2)} (needs ${min})`);
  }
}
console.log(failures ? `\n${failures} contrast failure(s)` : "\nAll contrast pairs pass.");
process.exit(failures ? 1 : 0);

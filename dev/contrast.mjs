// Checks WCAG contrast for every text/background and UI pair defined in src/styles/tokens.css,
// in both themes: "light" (pinned with data-theme="light") and "dark", which is Stygian, the default.
// Run: node dev/contrast.mjs   (exit 1 on any failure)
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
  // The Study Plan's solid level badge, and the level's border and bar-segment color.
  ["on-diff-f", "diff-f-solid", TEXT],
  ["on-diff-c", "diff-c-solid", TEXT],
  ["on-diff-ch", "diff-ch-solid", TEXT],
  ["diff-f-line", "surface", UI],
  ["diff-c-line", "surface", UI],
  ["diff-ch-line", "surface", UI],
  ["diff-f", "surface", TEXT],
  ["diff-c", "surface", TEXT],
  ["diff-ch", "surface", TEXT],
  ["border-strong", "surface", UI],
  ["border-strong", "bg", UI],
  ["focus-ring", "surface", UI],
  ["focus-ring", "bg", UI],
  ["focus-ring", "surface-2", UI],
  ["chart-accent", "bg", UI],
  // A progress bar's fill on its track; checkboxes and radios use the same color on the surface.
  ["chart-accent", "track", UI],
  ["success-icon", "surface", UI],
  ["warning-icon", "surface", UI],
  ["danger-icon", "surface", UI],
  ["chart-got", "surface", UI],
  ["chart-accent", "surface", UI],
  // The sidebar's current page: its label, and the marker drawn on its filled item.
  ["nav-active-text", "nav-active-bg", TEXT],
  ["nav-marker", "nav-active-bg", UI],
  // The phone tab bar's marker, drawn on the bar.
  ["nav-marker", "surface", UI],
  // Hovered rows and buttons.
  ["text", "surface-hover", TEXT],
  ["text-2", "surface-hover", TEXT],
  ["muted", "surface-hover", TEXT],
  // Selected text, tips, and the ghost button's hover.
  ["text", "selection", TEXT],
  ["info-text", "info-soft", TEXT],
  ["accent-text", "accent-soft", TEXT],
  // The Dark Mode switch: its knob on the track, on and off.
  ["switch-knob", "accent", UI],
  ["switch-knob", "border-strong", UI],
  // The raised study card's text, the due counts, the countdown, chosen chips, the logo's glyph.
  ...["text", "text-2", "muted"].map((fg) => [fg, "surface-raised", TEXT]),
  ["accent-text", "surface-raised", TEXT],
  ["count-text", "count-bg", TEXT],
  ["accent-numeral", "surface", TEXT],
  ["selected-edge", "surface", UI],
  ["brand-glyph", "accent", UI],
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

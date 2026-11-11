"use client";

import { useTheme, type Look } from "@/components/ThemeToggle";

type Pref = "light" | "dark" | "system";

const OPTIONS: Array<{ value: Look; label: string; hint: string }> = [
  { value: "dark", label: "Stygian", hint: "The dark Forgotten Library look (default)" },
  { value: "light", label: "Light", hint: "White and light gray" },
];

/** Settings: the two looks. It follows the sidebar's Dark Mode switch, and the switch follows it. */
export function ThemeChoice({ initial }: { initial: Pref }) {
  const { current, pending, choose } = useTheme(initial);
  return (
    <fieldset className="stack-sm">
      <legend className="label" style={{ marginBottom: 8 }}>
        Theme
      </legend>
      {OPTIONS.map((o) => (
        <label key={o.value} className="checkbox">
          <input type="radio" name="theme" value={o.value} checked={current === o.value} onChange={() => choose(o.value)} />
          <span>
            <strong>{o.label}</strong> <span className="muted">– {o.hint}</span>
          </span>
        </label>
      ))}
      <p className="xsmall muted" aria-live="polite">
        {pending ? "Saving…" : "Your choice is saved to your profile."}
      </p>
    </fieldset>
  );
}

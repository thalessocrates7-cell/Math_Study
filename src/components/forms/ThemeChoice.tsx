"use client";

import { useState, useTransition } from "react";
import { setTheme } from "@/app/actions/auth";

type Pref = "light" | "dark" | "system";

const OPTIONS: Array<{ value: Pref; label: string; hint: string }> = [
  { value: "light", label: "Light", hint: "White and light gray" },
  { value: "dark", label: "Dark", hint: "Dark gray, easier at night" },
  { value: "system", label: "System", hint: "Match this device" },
];

export function ThemeChoice({ initial }: { initial: Pref }) {
  const [value, setValue] = useState<Pref>(initial);
  const [pending, startTransition] = useTransition();
  return (
    <fieldset className="stack-sm">
      <legend className="label" style={{ marginBottom: 8 }}>
        Theme
      </legend>
      {OPTIONS.map((o) => (
        <label key={o.value} className="checkbox">
          <input
            type="radio"
            name="theme"
            value={o.value}
            checked={value === o.value}
            onChange={() => {
              setValue(o.value);
              if (o.value === "system") delete document.documentElement.dataset.theme;
              else document.documentElement.dataset.theme = o.value;
              startTransition(() => setTheme(o.value));
            }}
          />
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

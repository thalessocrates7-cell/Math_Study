"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { setTheme } from "@/app/actions/auth";
import { crossFade } from "@/lib/motion";

type Pref = "light" | "dark" | "system";

/** The shown theme and a way to flip it; the choice is saved (cookie, and the student's profile). */
export function useTheme(initial: Pref) {
  const [resolved, setResolved] = useState<"light" | "dark" | null>(initial === "system" ? null : initial);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    // While no explicit theme is pinned on <html>, follow the device setting (and its changes).
    const sync = () => {
      if (!document.documentElement.dataset.theme) setResolved(mq.matches ? "dark" : "light");
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const current = resolved ?? "light";
  const next = current === "dark" ? "light" : "dark";
  const flip = () => {
    setResolved(next);
    crossFade(() => {
      document.documentElement.dataset.theme = next;
    });
    startTransition(() => setTheme(next));
  };
  return { current, next, flip };
}

/** Icon button (phone top bar): switches between light and dark. */
export function ThemeToggle({ initial }: { initial: Pref }) {
  const { current, next, flip } = useTheme(initial);
  return (
    <button type="button" className="icon-btn" aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`} onClick={flip}>
      {current === "dark" ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
    </button>
  );
}

/** Sidebar row: a moon, "Dark Mode" and an on/off switch. */
export function ThemeSwitch({ initial }: { initial: Pref }) {
  const { current, flip } = useTheme(initial);
  const on = current === "dark";
  return (
    <div className="theme-row">
      <Moon size={20} aria-hidden="true" />
      <span id="dark-mode-label">Dark Mode</span>
      <button type="button" role="switch" aria-checked={on} aria-labelledby="dark-mode-label" className="switch" onClick={flip}>
        <span className="switch-knob" aria-hidden="true" />
      </button>
    </div>
  );
}

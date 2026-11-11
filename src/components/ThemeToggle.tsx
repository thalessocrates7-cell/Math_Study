"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { setTheme } from "@/app/actions/auth";
import { crossFade } from "@/lib/motion";

type Pref = "light" | "dark" | "system";
/** What is on screen: "dark" is Stygian, the default look; "light" is the earlier light look. */
export type Look = "light" | "dark";

/** The browser bar's color for each look (the page background). */
const THEME_COLOR: Record<Look, string> = { dark: "#0b080b", light: "#f7f8fa" };

/** The look a saved preference shows: Stygian unless the light look was chosen ("system" is the default). */
export function lookOf(pref: Pref): Look {
  return pref === "light" ? "light" : "dark";
}

/** Shows a look now (cross-faded) and colors the browser bar to match; saving is separate. */
function applyLook(look: Look): void {
  crossFade(() => {
    document.documentElement.dataset.theme = look;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[look]);
  });
}

/**
 * The look on screen and ways to change it; a change is saved (cookie, and the student's profile).
 * Every control that uses it follows changes made by the others (the sidebar switch, the top-bar
 * button and Settings), because it reads the look from <html data-theme>.
 */
export function useTheme(initial: Pref) {
  const [current, setCurrent] = useState<Look>(lookOf(initial));
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setCurrent(root.dataset.theme === "light" ? "light" : "dark");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const choose = (look: Look) => {
    setCurrent(look);
    applyLook(look);
    startTransition(() => setTheme(look));
  };
  const next: Look = current === "dark" ? "light" : "dark";
  return { current, next, pending, choose, flip: () => choose(next) };
}

/** Icon button (phone top bar, landing, sign-in and admin): switches between Stygian and light. */
export function ThemeToggle({ initial }: { initial: Pref }) {
  const { current, next, flip } = useTheme(initial);
  return (
    <button type="button" className="icon-btn" aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`} onClick={flip}>
      {current === "dark" ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
    </button>
  );
}

/** Sidebar row: a moon, "Dark Mode" and an on/off switch (on is Stygian). */
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

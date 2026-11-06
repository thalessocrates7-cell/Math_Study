"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { setTheme } from "@/app/actions/auth";

type Pref = "light" | "dark" | "system";

/** Switches between light and dark; the choice is saved (cookie, and the student's profile). */
export function ThemeToggle({ initial }: { initial: Pref }) {
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

  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        setResolved(next);
        startTransition(() => setTheme(next));
      }}
    >
      {current === "dark" ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
    </button>
  );
}

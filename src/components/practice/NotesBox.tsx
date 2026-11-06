"use client";

import { useEffect, useRef, useState } from "react";
import { saveNoteAction } from "@/app/actions/practice";

type Status = "idle" | "saving" | "saved" | "error";

/** Personal notes for one problem; saved automatically while typing and when leaving the box. */
export function NotesBox({ problemId, initial }: { problemId: string; initial: string }) {
  const [text, setText] = useState(initial);
  const [status, setStatus] = useState<Status>("idle");
  const saved = useRef(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function save(value: string) {
    if (value === saved.current) return;
    setStatus("saving");
    try {
      const res = await saveNoteAction(problemId, value);
      if (!res.ok) throw new Error("not saved");
      saved.current = value;
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <div className="field">
      <h2 id="notes-title">Notes</h2>
      <textarea
        id="notes"
        aria-labelledby="notes-title"
        className="textarea"
        placeholder="Add a note for this problem…"
        maxLength={4000}
        value={text}
        onChange={(e) => {
          const value = e.target.value;
          setText(value);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => save(value), 900);
        }}
        onBlur={() => {
          if (timer.current) clearTimeout(timer.current);
          void save(text);
        }}
      />
      <p className="xsmall muted" aria-live="polite">
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "error" ? "Couldn't save. Check your connection." : "Only you can see your notes."}
      </p>
    </div>
  );
}

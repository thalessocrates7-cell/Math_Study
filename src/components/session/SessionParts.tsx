import { CalendarClock, ChevronRight, Circle, CircleCheck, CircleDot, History, Plus, SkipForward, Sparkles, Target, Zap } from "lucide-react";
import Link from "next/link";
import type { Difficulty } from "@content/types";
import { skipItemAction } from "@/app/actions/session";
import { DifficultyBadge } from "@/components/Badges";
import { TRACK_LABEL, type Track } from "@/lib/reasons";

const TRACK_ICON = { new: Sparkles, challenge: Zap, reinforcement: Target, lookback: History, extra: Plus } as const;

/** The study track an item belongs to, always as an icon plus its name. */
export function TrackPill({ track, bonus = false }: { track: Track; bonus?: boolean }) {
  const Icon = TRACK_ICON[track];
  return (
    <span className={`pill track-${track}`}>
      <Icon size={13} aria-hidden="true" />
      {bonus ? "Bonus Challenge" : TRACK_LABEL[track]}
    </span>
  );
}

export type ItemRowStatus = "preview" | "pending" | "active" | "done" | "skipped" | "dropped";

export type ItemRow = {
  key: string;
  track: Track;
  bonus: boolean;
  optional: boolean;
  status: ItemRowStatus;
  /** The item Continue opens. */
  next: boolean;
  reason: string;
  minutes: number;
  difficulty: Difficulty;
  /** "5.2 The Definite Integral · Exercise 80" */
  where: string;
  href: string | null;
  /** Session item id when the student may skip it (look-backs). */
  skipId: string | null;
};

const STATUS = {
  pending: { Icon: Circle, text: "To do", cls: "st-pending" },
  active: { Icon: CircleDot, text: "Started", cls: "st-active" },
  done: { Icon: CircleCheck, text: "Done", cls: "st-done" },
  skipped: { Icon: SkipForward, text: "Skipped", cls: "st-muted" },
  dropped: { Icon: CalendarClock, text: "Moved to next time", cls: "st-muted" },
} as const;

/** A session's problems in order: track, why it was chosen, where it's from, and its estimated time. */
export function ItemList({ rows, label }: { rows: ItemRow[]; label: string }) {
  return (
    <ol className="list session-items" aria-label={label}>
      {rows.map((r, i) => {
        const st = r.status === "preview" ? null : STATUS[r.status];
        const body = (
          <>
            <span className={`item-mark ${st ? st.cls : "st-num"}`} aria-hidden="true">
              {st ? <st.Icon size={20} /> : i + 1}
            </span>
            <span className="row-main">
              <span className="item-tags">
                <TrackPill track={r.track} bonus={r.bonus} />
                <DifficultyBadge d={r.difficulty} />
                {r.next ? <span className="pill pill-accent">Up next</span> : null}
                {r.optional ? <span className="pill pill-neutral">Optional</span> : null}
              </span>
              <span className="item-reason">{r.reason}</span>
              <span className="row-sub">
                {r.where} · <span className="num">about {r.minutes} min</span>
                {st ? ` · ${st.text}` : ""}
              </span>
            </span>
            {r.href ? <ChevronRight className="chev" size={18} aria-hidden="true" /> : null}
          </>
        );
        return (
          <li key={r.key} className={`session-item${st && st.cls === "st-muted" ? " is-muted" : ""}${r.status === "done" ? " is-done" : ""}`}>
            {r.href ? (
              <Link className="row-link" href={r.href}>
                {body}
              </Link>
            ) : (
              <div className="row-link row-static">{body}</div>
            )}
            {r.skipId ? (
              <form action={skipItemAction}>
                <input type="hidden" name="item" value={r.skipId} />
                <button className="btn btn-ghost btn-sm" type="submit">
                  Skip<span className="sr-only"> this look-back</span>
                </button>
              </form>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

import { BadgeCheck, Check, Circle, CircleCheck, CircleX, TriangleExclamationPoint, WavesHorizontal, X } from "lucide-react";
import { DIFFICULTY_LABEL, type Difficulty } from "@content/types";
import type { ProblemStatus } from "@/lib/mastery";

const LETTER: Record<Difficulty, string> = { F: "F", C: "C", Ch: "Ch" };

/** `decorative` hides the badge from screen readers when the level's name is already written next to it. */
export function DifficultyBadge({ d, short = false, decorative = false }: { d: Difficulty; short?: boolean; decorative?: boolean }) {
  return (
    <span className={`diff diff-${d}`} aria-hidden={decorative || undefined}>
      <span className="diff-letter" aria-hidden="true">
        {LETTER[d]}
      </span>
      {short ? <span className="sr-only">{DIFFICULTY_LABEL[d]}</span> : <span>{DIFFICULTY_LABEL[d]}</span>}
    </span>
  );
}

const STATUS_TEXT: Record<ProblemStatus, string> = {
  new: "Not started",
  got_it: "Got it",
  mastered: "Mastered",
  shaky: "Shaky",
  lost: "Lost",
};

export function StatusLabel({ status, hideText = false }: { status: ProblemStatus; hideText?: boolean }) {
  const Icon = { new: Circle, got_it: CircleCheck, mastered: BadgeCheck, shaky: TriangleExclamationPoint, lost: CircleX }[status];
  return (
    <span className={`status status-${status}`}>
      <Icon size={16} aria-hidden="true" />
      {hideText ? <span className="sr-only">{STATUS_TEXT[status]}</span> : <span>{STATUS_TEXT[status]}</span>}
    </span>
  );
}

export function statusText(status: ProblemStatus): string {
  return STATUS_TEXT[status];
}

const RATING = {
  got_it: { text: "Got it", cls: "pill-success", Icon: Check },
  shaky: { text: "Shaky", cls: "pill-warning", Icon: WavesHorizontal },
  lost: { text: "Lost", cls: "pill-danger", Icon: X },
  skipped: { text: "Skipped", cls: "pill-neutral", Icon: Circle },
} as const;

export function RatingPill({ rating }: { rating: keyof typeof RATING }) {
  const r = RATING[rating];
  return (
    <span className={`pill ${r.cls}`}>
      <r.Icon size={13} aria-hidden="true" />
      {r.text}
    </span>
  );
}

export function sectionLabel(sectionId: string, title: string): string {
  return `${sectionId} – ${title}`;
}

export function problemLabel(openstax: number | null, problemId: string): string {
  return openstax ? `Exercise ${openstax}` : `Practice ${problemId.split("-")[1]?.toUpperCase() ?? ""}`.trim();
}

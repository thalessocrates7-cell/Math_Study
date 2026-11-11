/**
 * What the Dashboard's study card shows. It keeps the original "Recommended next" layout, and its
 * button starts (or continues) today's session, so the card describes that session's next problem.
 * Pure, so the choice can be tested.
 */

export type StudyCardInput = {
  /** The open session (started and not finished), or null. */
  open: {
    /** Its next item: planned items first, then optional ones. Null when nothing is left in it. */
    next: { problemId: string; href: string; track: string; essential: boolean } | null;
    /** 1-based place of `next` among the planned items, and how many are planned. */
    index: number | null;
    total: number;
  } | null;
  /** What a new session would hold right now (nothing is saved). */
  plan: { problemIds: string[]; minutes: number; scheduled: boolean };
  /** A session was already finished today. */
  doneToday: boolean;
  /** The first review problem due today, if any. */
  due: { problemId: string; href: string; count: number } | null;
  /** Today's session page (the Final Exam has its own); defaults to /session. */
  sessionHref?: string;
};

export type StudyCard =
  | { kind: "continue"; problemId: string | null; href: string; index: number | null; total: number; easier: boolean }
  | { kind: "start"; problemId: string; total: number; minutes: number }
  | { kind: "done-today" }
  | { kind: "review"; problemId: string; href: string; count: number }
  | { kind: "caught-up" };

export function chooseStudyCard(input: StudyCardInput): StudyCard {
  const { open, plan, doneToday, due } = input;
  if (open) {
    const next = open.next;
    return {
      kind: "continue",
      problemId: next?.problemId ?? null,
      href: next?.href ?? input.sessionHref ?? "/session",
      index: next?.essential ? open.index : null,
      total: open.total,
      easier: next?.track === "reinforcement",
    };
  }
  const first = plan.problemIds[0];
  // A first session can always start (on unscheduled days too, at the default length). After one is
  // done, another starts here only when the schedule plans one; otherwise extra practice is on /session.
  if (first && (!doneToday || plan.scheduled)) {
    return { kind: "start", problemId: first, total: plan.problemIds.length, minutes: plan.minutes };
  }
  if (doneToday) return { kind: "done-today" };
  if (due) return { kind: "review", ...due };
  return { kind: "caught-up" };
}

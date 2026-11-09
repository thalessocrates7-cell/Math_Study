/** Plain-English pacing for the dashboard and the session page (one wording everywhere). */
import { formatMinutes } from "./availability";
import type { Pacing } from "./planner";

export type PacingText = { label: string; detail: string; tone: "success" | "accent" | "warning" };

export function pacingText(p: Pacing): PacingText {
  if (p.examPassed) {
    return { label: "Exam date passed", detail: "Taking a make-up? Set your own exam date in your study schedule.", tone: "accent" };
  }
  if (p.finalReview) {
    return { label: "Final review", detail: "The last study days before the exam go to review across every unit you've studied.", tone: "accent" };
  }
  switch (p.status) {
    case "ahead":
      return { label: "Ahead of schedule", detail: "Your time covers every planned problem, with room for extra practice.", tone: "success" };
    case "on_track":
      return { label: "On track", detail: "Your schedule covers every unit before the exam.", tone: "success" };
    case "tight":
      return {
        label: "Tight schedule",
        detail: "Your schedule just covers every unit, so yesterday's Challenge is an optional bonus for now.",
        tone: "warning",
      };
    case "behind":
      return {
        label: "Behind schedule",
        detail: p.extraWeeklyMinutes
          ? `Your sessions don't cover every unit yet. Adding about ${formatMinutes(p.extraWeeklyMinutes)} a week would.`
          : "Your sessions don't cover every unit yet. More study time would help.",
        tone: "warning",
      };
  }
}

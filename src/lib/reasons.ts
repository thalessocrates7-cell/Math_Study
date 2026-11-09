/**
 * Why the planner chose an item. Stored with each session item as a code plus parameters, so the
 * explanation a student saw can be shown again later (and admins see the same words).
 */
import { formatMonthDay } from "./dates";

export type ReasonCode =
  | "new_warmup"
  | "new_core"
  | "new_next_unit"
  | "new_unstudied_final"
  | "challenge_next_day"
  | "second_core"
  | "core_again_after_solution"
  | "reinforce_shaky"
  | "reinforce_lost"
  | "reinforce_similar"
  | "reinforce_easier"
  | "lookback_bridge"
  | "lookback_due"
  | "lookback_weak"
  | "lookback_building_block"
  | "lookback_retention"
  | "lookback_final"
  | "extra_ahead"
  | "extra_challenge"
  | "extra_lookback"
  | "bonus_challenge";

export type Reason = { code: ReasonCode; params?: Record<string, string | number> };

export type Track = "new" | "challenge" | "reinforcement" | "lookback" | "extra";

/** The three tracks named in the spec, plus the Challenge (shown under New learning) and Keep going. */
export const TRACK_LABEL: Record<Track, string> = {
  new: "New learning",
  challenge: "Challenge",
  reinforcement: "Targeted Reinforcement",
  lookback: "Regressive Study",
  extra: "Keep going",
};

export type ReasonLookup = {
  /** "5.2" -> "The Definite Integral" */
  unitTitle?: (unitId: string) => string | undefined;
  /** "5.2:net-signed-area" -> "Net signed area" */
  skillLabel?: (skillKey: string) => string | undefined;
};

const RATING_WORD: Record<string, string> = { got_it: "Got it", shaky: "Shaky", lost: "Lost" };

function unit(id: unknown, lookup: ReasonLookup): string {
  const s = String(id ?? "");
  const title = lookup.unitTitle?.(s);
  return title ? `${s} ${title}` : s;
}

function skill(key: unknown, lookup: ReasonLookup): string {
  const s = String(key ?? "");
  const label = lookup.skillLabel?.(s);
  return (label ?? s.split(":")[1] ?? s).toLowerCase();
}

function day(iso: unknown): string {
  const s = String(iso ?? "");
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? formatMonthDay(s) : s;
}

/** Plain-English sentence for a reason. */
export function reasonText(reason: Reason, lookup: ReasonLookup = {}): string {
  const p = reason.params ?? {};
  switch (reason.code) {
    case "new_warmup":
      return `A Foundation warm-up to start ${unit(p.unit, lookup)}.`;
    case "new_core":
      return p.skill ? `Next in ${unit(p.unit, lookup)}: practice ${skill(p.skill, lookup)}.` : `Next in ${unit(p.unit, lookup)}.`;
    case "new_next_unit":
      return `New unit: ${unit(p.unit, lookup)}, after your planned work in ${unit(p.prev, lookup)}.`;
    case "new_unstudied_final":
      return `You haven't studied ${skill(p.skill, lookup)} yet. One problem on it before the exam.`;
    case "challenge_next_day":
      return `Yesterday's Challenge: you got a ${skill(p.skill, lookup)} problem on ${day(p.day)}. Try a harder one.`;
    case "second_core":
      return `You got a ${skill(p.skill, lookup)} problem on ${day(p.day)}. One more on a new day shows it stuck.`;
    case "core_again_after_solution":
      return `You used the worked solution on ${skill(p.skill, lookup)} on ${day(p.day)}. Try another one on your own.`;
    case "reinforce_shaky":
      return `You rated this Shaky on ${day(p.day)}. Let's try it again.`;
    case "reinforce_lost":
      return `You rated this Lost on ${day(p.day)}. Let's try it again.`;
    case "reinforce_similar":
      return `Similar to a problem you rated Shaky on ${day(p.day)}.`;
    case "reinforce_easier":
      return "An easier problem on the same idea, after a Lost.";
    case "lookback_bridge":
      return `You've started ${unit(p.current, lookup)}. One problem from ${unit(p.unit, lookup)} to check it stuck.`;
    case "lookback_due":
      return `You studied ${unit(p.unit, lookup)} ${p.days} day${Number(p.days) === 1 ? "" : "s"} ago. Let's check it stuck.`;
    case "lookback_weak":
      return `You rated a ${unit(p.unit, lookup)} problem on ${skill(p.skill, lookup)} ${RATING_WORD[String(p.rating)] ?? p.rating} on ${day(p.day)}.`;
    case "lookback_building_block":
      return `${unit(p.unit, lookup)} is a building block for ${unit(p.current, lookup)}.`;
    case "lookback_retention":
      return `Retention check: you got this one on ${day(p.day)}. Can you still do it?`;
    case "lookback_final":
      return `Final review before the exam: ${unit(p.unit, lookup)}.`;
    case "extra_ahead":
      return `Extra practice in ${unit(p.unit, lookup)}.`;
    case "extra_challenge":
      return `An extra Challenge on ${skill(p.skill, lookup)}.`;
    case "extra_lookback":
      return `Review ${unit(p.unit, lookup)} early.`;
    case "bonus_challenge":
      return `Bonus: yesterday's Challenge on ${skill(p.skill, lookup)}.`;
    default:
      return "Recommended for you.";
  }
}

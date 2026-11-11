/** Display rows for planned (preview) and saved session items. Server-only helpers. */
import { problemLabel } from "@/components/Badges";
import type { SessionItem } from "@/db/schema";
import { reasonText } from "@/lib/reasons";
import type { PlannedItem } from "@/lib/session-builder";
import type { Loaded } from "@/server/model";
import { practiceHref } from "@/server/sessions";
import type { ItemRow } from "./SessionParts";

export function whereText(loaded: Pick<Loaded, "problemById" | "sectionById">, problemId: string): string {
  const p = loaded.problemById.get(problemId);
  if (!p) return problemId;
  const title = loaded.sectionById.get(p.sectionId)?.title;
  return `${p.sectionId}${title ? ` ${title}` : ""} · ${problemLabel(p.openstaxNumber, p.id)}`;
}

const isBonus = (i: Pick<PlannedItem, "reason">) => i.reason.code === "bonus_challenge";

export function plannedRows(loaded: Loaded, items: PlannedItem[], bonus: PlannedItem | null): ItemRow[] {
  const all = bonus ? [...items, bonus] : items;
  return all.map((it, i) => ({
    key: `p${i}:${it.problemId}`,
    track: it.track,
    bonus: isBonus(it),
    optional: !it.essential,
    status: "preview",
    next: false,
    reason: reasonText(it.reason, loaded.lookup),
    minutes: it.minutes,
    difficulty: loaded.problemById.get(it.problemId)?.difficulty ?? "C",
    where: whereText(loaded, it.problemId),
    href: null,
    skipId: null,
  }));
}

/** Saved items: open ones link to the problem; open look-backs can be skipped. */
export function savedRows(loaded: Loaded, items: SessionItem[], nextId: string | null): ItemRow[] {
  return items.map((it) => {
    const open = it.status === "pending" || it.status === "active";
    return {
      key: it.id,
      track: it.track,
      bonus: isBonus(it),
      optional: !it.essential,
      status: it.status,
      next: it.id === nextId,
      reason: reasonText(it.reason, loaded.lookup),
      minutes: it.minutes,
      difficulty: loaded.problemById.get(it.problemId)?.difficulty ?? "C",
      where: whereText(loaded, it.problemId),
      href: open ? practiceHref(it, loaded.prep) : null,
      skipId: open && it.track === "lookback" ? it.id : null,
    };
  });
}

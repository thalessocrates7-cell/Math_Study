import { describe, expect, it } from "vitest";
import { checklistFor, checklistProgress, defaultSection, nextUnchecked, parseLevel, planHref } from "../src/lib/checklist";

const P = (id: string, sectionId: string, difficulty: "F" | "C" | "Ch", sort: number, active = true) => ({ id, sectionId, difficulty, sort, active });
const bank = [
  P("5.3-3", "5.3", "Ch", 3),
  P("5.3-1", "5.3", "Ch", 1),
  P("5.3-2", "5.3", "C", 2),
  P("5.3-9", "5.3", "Ch", 9, false),
  P("5.2-1", "5.2", "Ch", 1),
];

describe("study plan checklist", () => {
  it("lists only the chosen section and level, active, in textbook order", () => {
    expect(checklistFor(bank, "5.3", "challenge").map((p) => p.id)).toEqual(["5.3-1", "5.3-3"]);
    expect(checklistFor(bank, "5.3", "foundation")).toEqual([]);
  });

  it("counts progress", () => {
    const list = checklistFor(bank, "5.3", "challenge");
    expect(checklistProgress(list, new Set())).toEqual({ done: 0, total: 2, percent: 0 });
    expect(checklistProgress(list, new Set(["5.3-1"]))).toEqual({ done: 1, total: 2, percent: 50 });
    expect(checklistProgress([], new Set())).toEqual({ done: 0, total: 0, percent: 0 });
    expect(checklistProgress([{ id: "a" }, { id: "b" }, { id: "c" }], new Set(["a"])).percent).toBe(33);
  });

  it("finds the next unticked problem, wrapping around", () => {
    const list = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(nextUnchecked(list, new Set(["a"]))).toBe("b");
    expect(nextUnchecked(list, new Set(["b"]), "a")).toBe("c");
    expect(nextUnchecked(list, new Set(["c"]), "b")).toBe("a");
    expect(nextUnchecked(list, new Set(["a", "b", "c"]), "a")).toBeNull();
  });

  it("reads levels and builds the address", () => {
    expect(parseLevel("challenge")).toBe("challenge");
    expect(parseLevel("Ch")).toBe("challenge");
    expect(parseLevel("nope")).toBeNull();
    expect(planHref("5.3", "challenge")).toBe("/plan?section=5.3&level=challenge");
  });

  it("opens on the current section, else the first", () => {
    expect(defaultSection(["4.10", "5.1"], "5.1")).toBe("5.1");
    expect(defaultSection(["4.10", "5.1"], null)).toBe("4.10");
    expect(defaultSection(["4.10", "5.1"], "4.1")).toBe("4.10");
  });
});

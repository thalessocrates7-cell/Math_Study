import { describe, expect, it } from "vitest";
import { ALL_PROBLEMS, CORE_SECTIONS, DEFAULT_PLAN, SECTIONS } from "../content/index";
import { renderRich } from "../src/lib/tex";

describe("problem bank content", () => {
  it("has unique ids that start with their section", () => {
    const ids = ALL_PROBLEMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of ALL_PROBLEMS) expect(p.id.startsWith(`${p.section}-`)).toBe(true);
  });

  it("covers every Exam 4 section with enough problems for the default 5/7/3 plan plus spares", () => {
    for (const s of CORE_SECTIONS) {
      const list = ALL_PROBLEMS.filter((p) => p.section === s.id);
      const n = (d: string) => list.filter((p) => p.difficulty === d).length;
      expect(n("F"), `${s.id} Foundation`).toBeGreaterThan(DEFAULT_PLAN.foundation);
      expect(n("C"), `${s.id} Core`).toBeGreaterThan(DEFAULT_PLAN.core);
      expect(n("Ch"), `${s.id} Challenge`).toBeGreaterThan(DEFAULT_PLAN.challenge);
    }
  });

  it("keeps supplementary sections out of the study order and lists them last", () => {
    const supplementary = SECTIONS.filter((s) => s.kind === "supplementary");
    expect(supplementary.map((s) => s.id)).toEqual(["4.1", "4.2"]);
    const lastCore = Math.max(...CORE_SECTIONS.map((s) => s.sort));
    for (const s of supplementary) expect(s.sort).toBeGreaterThan(lastCore);
  });

  it("writes every prerequisite as a known section:skill", () => {
    const known = new Set(SECTIONS.flatMap((s) => s.concepts.map((c) => `${s.id}:${c.id}`)));
    for (const s of SECTIONS) {
      for (const c of s.concepts) {
        for (const p of c.prerequisites ?? []) {
          expect(known.has(p), `${s.id}:${c.id} lists unknown prerequisite ${p}`).toBe(true);
          expect(p, `${s.id}:${c.id} lists itself`).not.toBe(`${s.id}:${c.id}`);
        }
      }
    }
  });

  it("uses only known concept tags, and every tag is used", () => {
    // Supplementary sections have no problems yet, so only the Exam 4 sections must use every tag.
    for (const s of SECTIONS) {
      const known = new Set(s.concepts.map((c) => c.id));
      const used = new Set<string>();
      for (const p of ALL_PROBLEMS.filter((x) => x.section === s.id)) {
        expect(p.concepts.length, p.id).toBeGreaterThan(0);
        for (const c of p.concepts) {
          expect(known.has(c), `${p.id} uses unknown concept ${c}`).toBe(true);
          used.add(c);
        }
      }
      if (s.kind !== "core") continue;
      for (const c of known) expect(used.has(c), `${s.id} concept ${c} is unused`).toBe(true);
    }
  });

  it("gives every problem a hint, an answer, at least two steps and a check", () => {
    for (const p of ALL_PROBLEMS) {
      expect(p.hints.length, p.id).toBeGreaterThan(0);
      expect(p.answer.trim().length, p.id).toBeGreaterThan(0);
      expect(p.steps.length, p.id).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(p.check) ? p.check.length : 1, p.id).toBeGreaterThan(0);
      if (p.figure) expect(p.figure.alt.length, `${p.id} figure alt`).toBeGreaterThan(20);
    }
  });

  it("renders every piece of TeX without errors", () => {
    for (const p of ALL_PROBLEMS) {
      const fields = [p.statement, p.answer, ...p.hints, ...p.steps.flatMap((s) => [s.title, s.body])];
      for (const f of fields) {
        expect(() => renderRich(f, { throwOnError: true }), `${p.id}: ${f.slice(0, 60)}`).not.toThrow();
      }
    }
  });

  it("has no broken values from a bad template (NaN or [object Object])", () => {
    for (const p of ALL_PROBLEMS) {
      const all = JSON.stringify(p);
      expect(all.includes("[object Object]") || /\bNaN\b/.test(all), p.id).toBe(false);
    }
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ALL_PROBLEMS, CORE_SECTIONS, DEFAULT_PLAN, FINAL_POOL, FINAL_PROBLEMS, FINAL_SECTIONS, SECTIONS } from "../content/index";
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

describe("Final Exam questions", () => {
  it("imports exactly the pool's questions in their chapters, numbered as in OpenStax, without 542", () => {
    const ids = FINAL_PROBLEMS.map((p) => p.id).sort();
    const expected = FINAL_POOL.flatMap((c) => c.numbers.map((n) => `${c.sectionId}-${n}`)).sort();
    expect(ids).toEqual(expected);
    // The spec's 77, plus all 25 of Chapter 3's review exercises, 367–391 (added at the owner's request).
    expect(ids).toHaveLength(102);
    expect(ids).not.toContain("4-542");
    for (const p of FINAL_PROBLEMS) expect(p.openstax, p.id).toBe(Number(p.id.split("-")[1]));
  });

  it("uses each chapter's skill tags, and every tag is used", () => {
    for (const s of FINAL_SECTIONS) {
      const known = new Set(s.concepts.map((c) => c.id));
      const used = new Set<string>();
      for (const p of FINAL_PROBLEMS.filter((x) => x.section === s.id)) {
        expect(p.concepts.length, p.id).toBeGreaterThan(0);
        for (const c of p.concepts) {
          expect(known.has(c), `${p.id} uses unknown concept ${c}`).toBe(true);
          used.add(c);
        }
      }
      for (const c of known) expect(used.has(c), `chapter ${s.id} concept ${c} is unused`).toBe(true);
    }
  });

  it("gives every full chapter Foundation, Core and Challenge questions (the planner uses all three)", () => {
    for (const s of FINAL_SECTIONS) {
      const list = FINAL_PROBLEMS.filter((p) => p.section === s.id);
      for (const d of ["F", "C", "Ch"] as const) expect(list.filter((p) => p.difficulty === d).length, `${s.id} ${d}`).toBeGreaterThan(1);
    }
  });

  it("shows the six original figures, each a real image of the stated size with a full description", () => {
    const withImage = FINAL_PROBLEMS.filter((p) => p.image);
    expect(withImage.map((p) => p.id).sort()).toEqual(["2-212", "3-386", "3-387", "4-529", "4-530", "4-551"]);
    for (const p of withImage) {
      const img = p.image!;
      const bytes = readFileSync(`public${img.src}`);
      expect(bytes.subarray(1, 4).toString("latin1"), `${p.id} is a PNG`).toBe("PNG");
      expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], `${p.id} size`).toEqual([img.width, img.height]);
      expect(img.alt.length, `${p.id} alt`).toBeGreaterThan(120);
    }
  });

  it("keeps the RAM table with 459–461, and the previous exercise's data with 232 and 463", () => {
    for (const id of ["5-459", "5-460", "5-461"]) {
      const q = FINAL_PROBLEMS.find((p) => p.id === id)!.statement;
      for (const row of ["| 1980 | 0 |", "| 1985 | −5,468,750 |", "| 1990 | −755,495 |", "| 1995 | −73,005 |", "| 2000 | −29,768 |", "| 2005 | −918 |", "| 2010 | −177 |"]) {
        expect(q, id).toContain(row);
      }
    }
    expect(FINAL_PROBLEMS.find((p) => p.id === "2-232")!.statement).toContain("x(t)=t^2-2t+4");
    expect(FINAL_PROBLEMS.find((p) => p.id === "5-463")!.statement).toContain("v(t)=6400t^2-6505t+2686");
  });

  it("keeps the Katrina table with 390–391, and the Ocean City model with 388–389", () => {
    const rows = ["| Hour | Wind speed (mph) |", "| 1 | 45 |", "| 5 | 75 |", "| 11 | 100 |", "| 29 | 115 |", "| 49 | 145 |", "| 58 | 175 |", "| 73 | 155 |", "| 81 | 125 |", "| 85 | 95 |", "| 107 | 35 |"];
    for (const id of ["3-390", "3-391"]) {
      const q = FINAL_PROBLEMS.find((p) => p.id === id)!.statement;
      for (const row of rows) expect(q, id).toContain(row);
    }
    for (const id of ["3-388", "3-389"]) {
      const q = FINAL_PROBLEMS.find((p) => p.id === id)!.statement;
      expect(q, id).toContain(String.raw`w(t)=1.9+2.9\cos\left(\frac{\pi}{6}t\right)`);
      expect(q, id).toContain("Ocean City");
    }
  });

  it("tags Chapter 3's groups of exercises (true or false, limit definition, higher orders, tangents, graphs, rates)", () => {
    const tags = (n: number) => FINAL_PROBLEMS.find((p) => p.id === `3-${n}`)!.concepts;
    for (const n of [367, 368, 369, 370]) expect(tags(n), String(n)).toContain("differentiability");
    for (const n of [371, 372]) expect(tags(n), String(n)).toContain("limit-definition");
    expect(tags(380)).toContain("implicit-differentiation");
    for (const n of [382, 383]) expect(tags(n), String(n)).toContain("higher-derivatives");
    for (const n of [384, 385]) expect(tags(n), String(n)).toContain("tangent-lines");
    for (const n of [386, 387]) expect(tags(n), String(n)).toContain("derivative-graphs");
    for (const n of [388, 389, 390, 391]) expect(tags(n), String(n)).toContain("rates-of-change");
  });
});

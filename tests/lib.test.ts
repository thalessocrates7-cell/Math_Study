import { describe, expect, it } from "vitest";
import { verifyAdminCode, hashAdminCode } from "../src/lib/admin-code";
import { addDays, daysBetween, formatLongDate, greeting, isISODate, relativeDay, todayISO } from "../src/lib/dates";
import { statusFrom, summarize } from "../src/lib/mastery";
import { nameKey, normalizeName } from "../src/lib/names";
import { computeAssignment, type PlanProblem } from "../src/server/plan";
import { plainText, renderPreview, renderRich } from "../src/lib/tex";

describe("dates (America/New_York)", () => {
  it("uses the New York calendar day", () => {
    // 2026-11-06 03:30 UTC is still Nov 5 in New York (EST, UTC-5).
    expect(todayISO(new Date("2026-11-06T03:30:00Z"))).toBe("2026-11-05");
    expect(todayISO(new Date("2026-11-06T05:30:00Z"))).toBe("2026-11-06");
  });
  it("adds days and counts between dates", () => {
    expect(addDays("2026-11-30", 2)).toBe("2026-12-02");
    expect(daysBetween("2026-11-05", "2026-12-02")).toBe(27);
    expect(relativeDay("2026-11-06", "2026-11-05")).toBe("tomorrow");
    expect(relativeDay("2026-11-02", "2026-11-05")).toBe("3 days ago");
  });
  it("formats and validates", () => {
    expect(formatLongDate("2026-11-05")).toBe("Thursday, November 5, 2026");
    expect(isISODate("2026-02-30")).toBe(false);
    expect(isISODate("2026-12-02")).toBe(true);
    expect(greeting(new Date("2026-11-06T01:00:00Z"))).toBe("Good evening");
  });
});

describe("names", () => {
  it("normalizes spacing and case into one account key", () => {
    const a = normalizeName("  Alice ", "Smith");
    const b = normalizeName("alice", "  SMITH  ");
    expect(a.ok && b.ok && a.key === b.key).toBe(true);
    expect(nameKey("Mary  Ann", "O’Neil")).toBe("mary ann|o'neil");
  });
  it("rejects blanks and odd characters with field-specific errors", () => {
    expect(normalizeName("", "")).toMatchObject({ ok: false, field: "both" });
    expect(normalizeName("Al", "")).toMatchObject({ ok: false, field: "last" });
    expect(normalizeName("<script>", "x")).toMatchObject({ ok: false, field: "first" });
    expect(normalizeName("José", "Núñez-Ortiz").ok).toBe(true);
  });
});

describe("mastery", () => {
  const at = (problemId: string, rating: "got_it" | "shaky" | "lost", day: string, hour = 12) => ({
    problemId,
    rating,
    ratedDay: day,
    ratedAt: new Date(`${day}T${String(hour).padStart(2, "0")}:00:00Z`),
  });
  it("needs Got It on two different days, with Got It last", () => {
    expect(summarize([at("p", "got_it", "2026-11-01")]).get("p")?.status).toBe("got_it");
    expect(summarize([at("p", "got_it", "2026-11-01"), at("p", "got_it", "2026-11-01", 15)]).get("p")?.status).toBe("got_it");
    expect(summarize([at("p", "got_it", "2026-11-01"), at("p", "got_it", "2026-11-03")]).get("p")?.status).toBe("mastered");
    expect(summarize([at("p", "got_it", "2026-11-01"), at("p", "got_it", "2026-11-03"), at("p", "lost", "2026-11-04")]).get("p")?.status).toBe("lost");
    expect(statusFrom(null, 0)).toBe("new");
  });
});

describe("computeAssignment", () => {
  const pool: PlanProblem[] = [
    ...Array.from({ length: 7 }, (_, i) => ({ id: `F${i}`, difficulty: "F" as const, concepts: [], sort: i })),
    ...Array.from({ length: 9 }, (_, i) => ({ id: `C${i}`, difficulty: "C" as const, concepts: [], sort: 10 + i })),
    ...Array.from({ length: 4 }, (_, i) => ({ id: `H${i}`, difficulty: "Ch" as const, concepts: [], sort: 20 + i })),
  ];
  const counts = { foundation: 5, core: 7, challenge: 3 };

  it("assigns 5/7/3 in difficulty then book order, stable per student", () => {
    const a = computeAssignment({ studentId: "s1", sectionId: "5.2", counts, pool, current: [], rated: new Set() });
    expect(a).toHaveLength(15);
    expect(a.slice(0, 5).every((id) => id.startsWith("F"))).toBe(true);
    expect(a.slice(5, 12).every((id) => id.startsWith("C"))).toBe(true);
    expect(a.slice(12).every((id) => id.startsWith("H"))).toBe(true);
    expect(computeAssignment({ studentId: "s1", sectionId: "5.2", counts, pool, current: [], rated: new Set() })).toEqual(a);
  });

  it("never drops problems the student already worked, even when counts shrink", () => {
    const first = computeAssignment({ studentId: "s1", sectionId: "5.2", counts, pool, current: [], rated: new Set() });
    const worked = new Set(first.slice(0, 4));
    const next = computeAssignment({ studentId: "s1", sectionId: "5.2", counts: { foundation: 2, core: 1, challenge: 1 }, pool, current: first, rated: worked });
    for (const id of worked) expect(next).toContain(id);
  });
});

describe("tex rendering", () => {
  it("renders inline and display math with MathML and escapes text", () => {
    const html = renderRich("Evaluate <b>this</b> $x^2$.\n$$\\int_0^1 x\\,dx$$");
    expect(html).toContain("&lt;b&gt;this&lt;/b&gt;");
    expect(html).toContain("<math");
    expect(html).toContain('class="math-display"');
  });
  it("keeps escaped dollars literal and builds tables", () => {
    const html = renderRich("Price \\$2.60\n| Year | Change |\n| 1950 | 0.03 |");
    expect(html).toContain("Price $2.60");
    expect(html).toContain("<th scope=\"col\">Year</th>");
    expect(html).toContain("<td>0.03</td>");
  });
  it("makes previews and plain text", () => {
    expect(renderPreview("Find it.\n$$x+1$$")).toContain("<math");
    expect(plainText("Find $x$ and \\$5")).toBe("Find x and $5");
  });
});

describe("admin code hashing", () => {
  it("verifies the right code only", () => {
    const stored = hashAdminCode("correct horse battery");
    expect(stored.startsWith("scrypt:")).toBe(true);
    expect(stored.includes("$")).toBe(false);
    expect(verifyAdminCode("correct horse battery", stored)).toBe(true);
    expect(verifyAdminCode("wrong code entirely", stored)).toBe(false);
    expect(verifyAdminCode("anything", undefined)).toBe(false);
    expect(verifyAdminCode("anything", "garbage")).toBe(false);
  });
});

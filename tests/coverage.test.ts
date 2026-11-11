/** Final Exam question coverage: the counts the dashboard shows, and that they never mislead. */
import { describe, expect, it } from "vitest";
import { computeCoverage } from "@/lib/coverage";

const pool = [
  { sectionId: "2", chapter: 2, title: "Limits", numbers: [208, 209, 210] },
  { sectionId: "5", chapter: 5, title: "Integration", numbers: [439, 440] },
];
const at = (day: string) => new Date(`${day}T15:00:00Z`);

describe("Final Exam question coverage", () => {
  it("starts at zero attempted with every question not yet attempted (and not counted as known)", () => {
    const { all, chapters } = computeCoverage({ pool, problems: [], rated: [], pending: new Set() });
    expect(all).toEqual({ total: 5, inApp: 0, attempted: 0, notAttempted: 5, awaitingReview: 0, latest: { got_it: 0, shaky: 0, lost: 0 }, rechecked: 0 });
    expect(chapters.map((c) => [c.sectionId, c.total, c.notAttempted])).toEqual([
      ["2", 3, 3],
      ["5", 2, 2],
    ]);
  });

  it("splits the pool into attempted and not attempted, and keeps the overlapping counts apart", () => {
    const problems = [
      { id: "2-208", sectionId: "2", openstaxNumber: 208, active: true },
      { id: "2-209", sectionId: "2", openstaxNumber: 209, active: true },
      { id: "2-210", sectionId: "2", openstaxNumber: 210, active: false },
      { id: "5-439", sectionId: "5", openstaxNumber: 439, active: true },
      // Not in the pool: never counted.
      { id: "5-999", sectionId: "5", openstaxNumber: 999, active: true },
      { id: "2-o1", sectionId: "2", openstaxNumber: null, active: true },
    ];
    const rated = [
      { problemId: "2-208", rating: "lost" as const, ratedDay: "2026-11-10", ratedAt: at("2026-11-10") },
      { problemId: "2-208", rating: "got_it" as const, ratedDay: "2026-11-12", ratedAt: at("2026-11-12") },
      { problemId: "2-209", rating: "shaky" as const, ratedDay: "2026-11-11", ratedAt: at("2026-11-11") },
      { problemId: "2-209", rating: "shaky" as const, ratedDay: "2026-11-11", ratedAt: new Date("2026-11-11T16:00:00Z") },
      { problemId: "5-439", rating: "skipped" as const, ratedDay: "2026-11-11", ratedAt: at("2026-11-11") },
      { problemId: "5-999", rating: "got_it" as const, ratedDay: "2026-11-11", ratedAt: at("2026-11-11") },
    ];
    const { all, chapters } = computeCoverage({ pool, problems, rated, pending: new Set(["2-209", "5-439", "5-999"]) });
    expect(all.total).toBe(5);
    expect(all.inApp).toBe(3); // 210 is retired, 440 isn't in the app yet
    expect(all.attempted).toBe(2); // a skip is not an attempt
    expect(all.notAttempted).toBe(3);
    expect(all.attempted + all.notAttempted).toBe(all.total);
    // Awaiting review overlaps both groups (5-439 was only skipped); 5-999 is outside the pool.
    expect(all.awaitingReview).toBe(2);
    expect(all.latest).toEqual({ got_it: 1, shaky: 1, lost: 0 });
    // 2-208 was rated on two different days; 2-209 twice on the same day.
    expect(all.rechecked).toBe(1);
    expect(chapters[0]).toMatchObject({ attempted: 2, notAttempted: 1, inApp: 2, awaitingReview: 1, rechecked: 1 });
    expect(chapters[1]).toMatchObject({ attempted: 0, notAttempted: 2, inApp: 1, awaitingReview: 1, rechecked: 0 });
  });
});

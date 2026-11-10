import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_AVAILABILITY } from "@/lib/availability";
import { parseScheduleForm } from "@/lib/schedule";

describe("schedule form", () => {
  it("saves availability and the exam date only; there is no extra-sections option", () => {
    const res = parseScheduleForm(
      { availability: JSON.stringify(DEFAULT_AVAILABILITY), examDate: "" },
      { today: "2026-11-09", classExamDate: "2026-12-02" },
    );
    expect(res.ok).toBe(true);
    if (res.ok) expect(Object.keys(res.value).sort()).toEqual(["availability", "examDateOverride"]);
    expect(readFileSync("src/components/forms/ScheduleForm.tsx", "utf8")).not.toMatch(/supplementary|Extra sections/);
  });
});

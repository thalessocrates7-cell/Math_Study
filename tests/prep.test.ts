/** The two study environments' pure rules: addresses, the nav, the way back, the exam time and the countdown. */
import { describe, expect, it } from "vitest";
import { exitHref, planHref } from "@/lib/checklist";
import { itemActive, navPath } from "@/lib/nav";
import {
  countdownLabel,
  countdownTo,
  formatExamTime,
  isFinalPath,
  parsePrep,
  practiceLink,
  RETURN_FALLBACK,
  returnCookieValue,
  returnPathFromCookies,
  routesFor,
  safeReturnPath,
} from "@/lib/prep";
import { PROBLEM_ID_RE } from "@/lib/ids";
import { FINAL_POOL, FINAL_SECTIONS } from "../content/index";

const params = (q: string) => new URLSearchParams(q);

describe("addresses of the two environments", () => {
  it("keeps the regular site where it was and puts the Final Exam under /final-exam", () => {
    expect(routesFor("exam4")).toMatchObject({ dashboard: "/dashboard", plan: "/plan", review: "/review", session: "/session", schedule: "/schedule" });
    expect(routesFor("final")).toMatchObject({
      dashboard: "/final-exam",
      plan: "/final-exam/plan",
      review: "/final-exam/review",
      progress: "/final-exam/progress",
      session: "/final-exam/session",
      settings: "/final-exam/settings",
      schedule: "/final-exam/schedule",
    });
    expect(practiceLink("exam4", "5.3-144")).toBe("/practice/5.3-144");
    expect(practiceLink("final", "2-208", { item: "abc" })).toBe("/final-exam/practice/2-208?item=abc");
    expect(practiceLink("final", "2-208", { s: "s1", item: "abc" })).toBe("/final-exam/practice/2-208?s=s1");
    expect(planHref("4", "challenge", "final")).toBe("/final-exam/plan?section=4&level=challenge");
    expect(planHref("5.3", "core")).toBe("/plan?section=5.3&level=core");
    expect(exitHref({ sessionId: "x", sectionId: "2", difficulty: "C", problemId: "2-208", prep: "final" })).toBe("/final-exam/session");
    expect(exitHref({ sessionId: null, sectionId: "2", difficulty: "F", problemId: "2-208", prep: "final" })).toBe("/final-exam/plan?section=2&level=foundation#p-2-208");
  });

  it("reads the environment from a path or a form value (anything unknown is the regular site)", () => {
    expect(isFinalPath("/final-exam")).toBe(true);
    expect(isFinalPath("/final-exam/plan")).toBe(true);
    expect(isFinalPath("/final-examples")).toBe(false);
    expect(isFinalPath("/dashboard")).toBe(false);
    expect(parsePrep("final")).toBe("final");
    expect(parsePrep("exam4")).toBe("exam4");
    expect(parsePrep(null)).toBe("exam4");
    expect(parsePrep("FINAL")).toBe("exam4");
  });

  it("accepts Final Exam problem ids as well as section ones", () => {
    for (const id of ["5.3-144", "4.10-o1", "2-208", "4-552"]) expect(PROBLEM_ID_RE.test(id), id).toBe(true);
    for (const id of ["2", "-208", "2-", "../2-208", "2-208;", "5.3.1-2"]) expect(PROBLEM_ID_RE.test(id), id).toBe(false);
  });
});

describe("the sidebar inside the Final Exam", () => {
  it("files a Final Exam practice problem under the Final Exam's own pages", () => {
    expect(navPath("/final-exam/practice/2-208", params("s=1"))).toBe("/final-exam/session");
    expect(navPath("/final-exam/practice/2-208", params("item=2"))).toBe("/final-exam/review");
    expect(navPath("/final-exam/practice/2-208", params(""))).toBe("/final-exam/plan");
    expect(navPath("/final-exam/plan", params(""))).toBe("/final-exam/plan");
    expect(navPath("/practice/5.1-8", params(""))).toBe("/plan");
  });

  it("lights the Final Exam's Dashboard only on its own page and today's session", () => {
    const dash = { href: "/final-exam", exact: true, also: ["/final-exam/session"] };
    expect(itemActive("/final-exam", dash)).toBe(true);
    expect(itemActive("/final-exam/session", dash)).toBe(true);
    expect(itemActive("/final-exam/plan", dash)).toBe(false);
    expect(itemActive("/final-exam/plan", { href: "/final-exam/plan" })).toBe(true);
    // Without `exact`, an item still covers the pages below it (the regular Study Plan).
    expect(itemActive("/plan/5.1", { href: "/plan" })).toBe(true);
  });
});

describe("going back to Integration Review", () => {
  it("remembers only safe pages of the regular site", () => {
    for (const ok of ["/dashboard", "/plan?section=5.3&level=core", "/plan?section=5.3&level=challenge#p-5.3-144", "/practice/5.3-144?s=abc", "/review", "/settings", "/schedule?setup=1"]) {
      expect(safeReturnPath(ok), ok).toBe(ok);
    }
    for (const bad of [
      "",
      "dashboard",
      "//evil.example/dashboard",
      "/\\evil.example",
      "https://evil.example/plan",
      "javascript:alert(1)",
      "/final-exam",
      "/final-exam/plan",
      "/admin/dashboard",
      "/planner",
      "/signin",
      `/plan?x=${"a".repeat(700)}`,
      "/plan\n/x",
      null,
      undefined,
    ]) {
      expect(safeReturnPath(bad), String(bad)).toBeNull();
    }
  });

  it("round-trips through the cookie, and falls back to the Dashboard otherwise", () => {
    const value = returnCookieValue("/plan?section=5.3&level=core#p-5.3-144");
    expect(value).toMatch(/^mth_return=[^;]+; path=\/; SameSite=Lax$/);
    const cookie = `mth_theme=dark; ${value!.split(";")[0]}; other=1`;
    expect(returnPathFromCookies(cookie)).toBe("/plan?section=5.3&level=core#p-5.3-144");
    expect(returnPathFromCookies("")).toBe(RETURN_FALLBACK);
    expect(returnPathFromCookies("mth_return=%2F%2Fevil.example")).toBe("/dashboard");
    expect(returnPathFromCookies("mth_return=%E0%A4%A")).toBe("/dashboard");
    expect(returnCookieValue("/final-exam/plan")).toBeNull();
    expect(RETURN_FALLBACK).toBe("/dashboard");
  });
});

describe("the Final Exam's date, time and countdown", () => {
  it("shows the 24-hour time as a 12-hour one", () => {
    expect(formatExamTime("14:00")).toBe("2:00 PM");
    expect(formatExamTime("00:05")).toBe("12:05 AM");
    expect(formatExamTime("12:30")).toBe("12:30 PM");
    expect(formatExamTime("9:00")).toBeNull();
    expect(formatExamTime("24:00")).toBeNull();
    expect(formatExamTime(null)).toBeNull();
  });

  it("counts calendar days and never a fixed number", () => {
    expect(countdownTo("2026-11-10", "2026-12-14")).toEqual({ kind: "days", days: 34 });
    expect(countdownTo("2026-11-11", "2026-12-14")).toEqual({ kind: "days", days: 33 });
    expect(countdownTo("2026-12-13", "2026-12-14")).toEqual({ kind: "tomorrow" });
    expect(countdownTo("2026-12-14", "2026-12-14", { nowHHMM: "09:00", examTime: "14:00" })).toEqual({ kind: "today", started: false });
    expect(countdownTo("2026-12-14", "2026-12-14", { nowHHMM: "14:00", examTime: "14:00" })).toEqual({ kind: "today", started: true });
    expect(countdownTo("2026-12-15", "2026-12-14")).toEqual({ kind: "passed" });
    expect(countdownLabel({ kind: "tomorrow" }, "2:00 PM")).toBe("Tomorrow at 2:00 PM");
    expect(countdownLabel({ kind: "today", started: false }, "2:00 PM")).toBe("Today at 2:00 PM");
    expect(countdownLabel({ kind: "today", started: false }, null)).toBe("Today");
    expect(countdownLabel({ kind: "today", started: true }, "2:00 PM")).toBe("Exam time has passed");
    expect(countdownLabel({ kind: "passed" }, null)).toBe("Exam date passed");
  });
});

describe("the Final Exam's chapters and candidate pool", () => {
  it("has the three chapters and the 77 questions of the import specification, without 542", () => {
    expect(FINAL_SECTIONS.map((s) => `${s.id} ${s.title}`)).toEqual(["2 Limits", "4 Applications of Derivatives", "5 Integration"]);
    const count = (id: string) => FINAL_POOL.find((c) => c.sectionId === id)!.numbers.length;
    expect([count("2"), count("4"), count("5")]).toEqual([25, 27, 25]);
    expect(FINAL_POOL.reduce((m, c) => m + c.numbers.length, 0)).toBe(77);
    const ch4 = FINAL_POOL.find((c) => c.sectionId === "4")!;
    expect(ch4.numbers).not.toContain(542);
    expect(ch4.numbers[0]).toBe(525);
    expect(ch4.numbers.at(-1)).toBe(552);
    expect(ch4.excluded).toEqual([542]);
    for (const c of FINAL_POOL) expect(new Set(c.numbers).size).toBe(c.numbers.length);
  });
});

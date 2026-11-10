import { describe, expect, it } from "vitest";
import { isActive, navPath } from "@/lib/nav";

const params = (q: string) => new URLSearchParams(q);

describe("which sidebar item is the current page", () => {
  it("keeps ordinary pages as they are", () => {
    expect(navPath("/dashboard", params(""))).toBe("/dashboard");
    expect(navPath("/settings", params("s=1"))).toBe("/settings");
  });

  it("files a practice problem under the place it was opened from", () => {
    expect(navPath("/practice/5.1-8", params("s=4b1c"))).toBe("/session");
    expect(navPath("/practice/5.1-8", params("item=9f2a"))).toBe("/review");
    expect(navPath("/practice/5.1-8", params(""))).toBe("/plan");
  });

  it("matches an item's own page and the pages below it, not look-alike paths", () => {
    expect(isActive("/plan", ["/plan"])).toBe(true);
    expect(isActive("/plan/5.1", ["/plan"])).toBe(true);
    expect(isActive("/planner", ["/plan"])).toBe(false);
    expect(isActive("/session", ["/dashboard", "/session"])).toBe(true);
  });
});

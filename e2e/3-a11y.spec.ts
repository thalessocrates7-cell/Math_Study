import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { E2E_ADMIN_CODE } from "../playwright.config";
import { adminSignIn, horizontalOverflow, signIn } from "./helpers";

const PUBLIC = ["/", "/signin", "/admin"];
const STUDENT = [
  "/dashboard",
  "/session",
  "/plan",
  "/plan?section=5.3&level=challenge",
  "/practice/5.2-72",
  "/practice/5.1-39",
  "/review",
  "/progress",
  "/settings",
  "/schedule",
  // The Final Exam's own pages (before its questions are added: the honest empty states).
  "/final-exam",
  "/final-exam/plan",
  "/final-exam/review",
  "/final-exam/progress",
  "/final-exam/session",
  "/final-exam/settings",
  "/final-exam/schedule",
];
const ADMIN = ["/admin/dashboard", "/admin/students", "/admin/problems", "/admin/problems/5.2-72", "/admin/plan", "/admin/settings"];
const SHOTS = "test-results/shots-e2e";

async function audit(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const serious = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  const report = serious.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(" | ")}`);
  expect(report, `axe violations on ${url}`).toEqual([]);
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`${scheme} theme`, () => {
    test.use({ colorScheme: scheme });

    test("public pages pass axe", async ({ page }) => {
      for (const url of PUBLIC) await audit(page, url);
    });

    test("student pages pass axe", async ({ page }) => {
      await signIn(page, "Grace", "Hopper");
      for (const url of STUDENT) await audit(page, url);
    });

    test("admin pages pass axe", async ({ page }) => {
      await adminSignIn(page, E2E_ADMIN_CODE);
      await expect(page).toHaveURL(/\/admin\/dashboard$/);
      for (const url of ADMIN) await audit(page, url);
    });
  });
}

test.describe("phone width (390px)", () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  test("no horizontal page scroll; screenshots for review", async ({ page }) => {
    for (const url of PUBLIC) {
      await page.goto(url);
      expect(await horizontalOverflow(page), `overflow on ${url}`).toBe(0);
      await page.screenshot({ path: `${SHOTS}/390${url.replace(/\//g, "_") || "_home"}.png`, fullPage: true });
    }
    await signIn(page, "Grace", "Hopper");
    for (const url of STUDENT) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      expect(await horizontalOverflow(page), `overflow on ${url}`).toBe(0);
      await page.screenshot({ path: `${SHOTS}/390${url.replace(/[^a-z0-9]/gi, "_")}.png`, fullPage: true });
    }
    await adminSignIn(page, E2E_ADMIN_CODE);
    for (const url of ADMIN) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      expect(await horizontalOverflow(page), `overflow on ${url}`).toBe(0);
      await page.screenshot({ path: `${SHOTS}/390${url.replace(/[^a-z0-9]/gi, "_")}.png`, fullPage: true });
    }
  });

  test("bottom tabs replace the sidebar and touch targets are at least 44px", async ({ page }) => {
    await signIn(page, "Grace", "Hopper");
    const tabs = page.getByRole("navigation", { name: "Main" });
    await expect(tabs.getByRole("link", { name: /Plan/ })).toBeVisible();
    for (const link of await tabs.getByRole("link").all()) {
      const box = await link.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    // The top bar's way into the Final Exam (the tab bar keeps its five items).
    const toFinal = await page.locator(".topbar").getByRole("link", { name: "Final Exam" }).boundingBox();
    expect(toFinal!.height).toBeGreaterThanOrEqual(44);
    await page.goto("/practice/4.10-466");
    for (const name of [/Get a Hint/, /Reveal Answer/, /Worked Solution/, /^Got it/, /^Shaky/, /^Lost/]) {
      const box = await page.getByRole("button", { name }).boundingBox();
      expect(box!.height, String(name)).toBeGreaterThanOrEqual(44);
    }
  });
});

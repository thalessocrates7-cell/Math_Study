import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./helpers";

// The Dashboard bug: a student who had never saved a study schedule was sent to the schedule page,
// which the sidebar marks as Settings, so "Dashboard" seemed to open Settings. The Dashboard must open.

/** The one item a navigation area marks as the current page. */
function current(page: Page, area: ".sidebar" | ".tabbar") {
  return page.locator(`${area} [aria-current="page"]`);
}

test("the Dashboard opens without a saved schedule, and the sidebar marks the page on screen", async ({ page }) => {
  await signIn(page, "Nora", "Navtest"); // a new student lands on /dashboard
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Nora");
  await expect(current(page, ".sidebar")).toHaveCount(1);
  await expect(current(page, ".sidebar")).toContainText("Dashboard");
  await expect(page.getByText("Sessions use the default study times")).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(current(page, ".sidebar")).toContainText("Dashboard");

  const side = page.locator(".sidebar");
  await side.getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(current(page, ".sidebar")).toContainText("Settings");

  await side.getByRole("link", { name: "Dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(current(page, ".sidebar")).toContainText("Dashboard");

  await page.goto("/settings");
  await side.getByRole("link", { name: /MTH 263/ }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/session");
  await expect(page).toHaveURL(/\/session$/);
  await expect(current(page, ".sidebar")).toContainText("Dashboard");

  // An old setup link now shows the normal schedule editor, under Settings.
  await page.goto("/schedule?setup=1");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Study schedule");
  await expect(current(page, ".sidebar")).toContainText("Settings");
});

test("a student can start studying right away, without setting a schedule", async ({ page }) => {
  await signIn(page, "Nora", "Navtest");
  await page.getByRole("button", { name: /Start Studying/ }).click();
  await expect(page).toHaveURL(/\/practice\/[^?]+\?s=/);
  await expect(page.getByText(/Problem 1 of \d+/).first()).toBeVisible();
  // A problem from today's session belongs to the Dashboard; one opened from the Study Plan, to the Study Plan.
  await expect(current(page, ".sidebar")).toContainText("Dashboard");
  const sessionProblem = page.url();
  await page.goto("/practice/5.2-72");
  await expect(current(page, ".sidebar")).toContainText("Study Plan");
  await page.goto(sessionProblem);

  await page.locator(".sidebar").getByRole("link", { name: "Dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("link", { name: /Continue Studying/ })).toBeVisible();
});

test.describe("phone width (390px)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the tab bar's Home opens the Dashboard and Settings opens Settings", async ({ page }) => {
    await signIn(page, "Nora", "Navphone");
    const tabs = page.locator(".tabbar");
    await expect(current(page, ".tabbar")).toContainText("Home");
    await tabs.getByRole("link", { name: /Settings/ }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(current(page, ".tabbar")).toContainText("Settings");
    await tabs.getByRole("link", { name: /Home/ }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(current(page, ".tabbar")).toContainText("Home");
  });
});

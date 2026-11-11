import { expect, test, type Page } from "@playwright/test";
import { horizontalOverflow, signIn } from "./helpers";

// The Final Exam environment: a separate set of the same pages under /final-exam, entered from the
// item under Settings, and left again through "Integration Review", which restores the exact place.

/** The one item a navigation area marks as the current page. */
const current = (page: Page, area: ".sidebar" | ".tabbar") => page.locator(`${area} [aria-current="page"]`);

/** Whole New York calendar days from today to the Final Exam (the countdown is never a fixed number). */
function daysToFinal(): number {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [y, m, d] = today.split("-").map(Number);
  return Math.round((Date.UTC(2026, 11, 14) - Date.UTC(y, m - 1, d)) / 86_400_000);
}

test("Final Exam sits directly under Settings, opens its own pages, and Integration Review returns to the exact place", async ({ page }) => {
  await signIn(page, "Fern", "Finaltest");
  const side = page.locator(".sidebar");

  // The sidebar keeps every item and adds Final Exam right after Settings; Sign out stays at the bottom.
  await expect(side.getByRole("navigation", { name: "Main" }).getByRole("link")).toHaveText(["Dashboard", "Study Plan", "Review Queue", "My Progress"]);
  await expect(side.getByRole("switch", { name: "Dark Mode" })).toBeVisible();
  await expect(side.getByRole("navigation", { name: "Account" }).getByRole("link")).toHaveText(["Settings", "Final Exam"]);
  await expect(side.getByRole("button", { name: "Sign out" })).toBeVisible();

  // Leave from a precise spot in the regular Study Plan.
  await page.goto("/plan?section=5.3&level=challenge");
  await expect(page.getByRole("heading", { level: 2, name: /5\.3 – The Fundamental Theorem/ })).toBeVisible();
  await side.getByRole("link", { name: "Final Exam" }).click();
  await expect(page).toHaveURL(/\/final-exam$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Fern");
  await expect(page.getByText("Your cumulative MTH 263 final exam preparation at a glance.")).toBeVisible();
  await expect(side.getByRole("link", { name: /MTH 263 Final Exam/ })).toBeVisible();
  await expect(current(page, ".sidebar")).toHaveText("Dashboard");
  await expect(side.getByRole("navigation", { name: "Account" }).getByRole("link")).toHaveText(["Settings", "Integration Review"]);

  // The exam card: the Final Exam's date, its time, and a countdown computed from today.
  const exam = page.getByRole("region", { name: "Final Exam", exact: true });
  await expect(exam).toContainText("December 14, 2026");
  await expect(exam).toContainText("2:00 PM");
  const days = daysToFinal();
  if (days > 1) await expect(exam).toContainText(`${days}days remaining`);

  // Nothing studied yet: zero progress and an honest start, never sample numbers.
  await expect(page.getByRole("link", { name: "0 Completed" })).toBeVisible();
  await expect(page.getByRole("link", { name: "0 Chapters mastered" })).toBeVisible();
  await expect(page.locator(".due-banner")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Start Studying/ })).toBeVisible();
  await expect(page.getByText("No Final Exam activity yet.")).toBeVisible();
  const coverage = page.getByRole("region", { name: "Question Coverage" });
  await expect(coverage).toContainText("Initial pool");
  await expect(coverage).toContainText("Not yet attempted77");
  await expect(coverage).toContainText("All of them are in the app.");

  // The Final Exam's own pages keep the Final Exam sidebar.
  await side.getByRole("link", { name: "Study Plan" }).click();
  await expect(page).toHaveURL(/\/final-exam\/plan/);
  await expect(current(page, ".sidebar")).toHaveText("Study Plan");
  await expect(page.getByRole("radio", { name: "2 Limits" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "4 Applications of Derivatives" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "5 Integration" })).toBeVisible();

  // A reload (or a direct link) still opens the Final Exam for a signed-in student.
  await page.reload();
  await expect(page).toHaveURL(/\/final-exam\/plan/);
  await expect(current(page, ".sidebar")).toHaveText("Study Plan");

  // A question that depends on a figure shows the original graph with its description.
  await page.goto("/final-exam/practice/2-212");
  await expect(page.getByRole("img", { name: /Graph of a piecewise function f/ })).toBeVisible();
  await expect(current(page, ".sidebar")).toHaveText("Study Plan");

  // Back to the exact place: 5.3 at the Challenge level.
  const back = side.getByRole("link", { name: "Integration Review" });
  await expect(back).toHaveAttribute("href", "/plan?section=5.3&level=challenge");
  await back.click();
  await expect(page).toHaveURL(/\/plan\?section=5\.3&level=challenge$/);
  await expect(page.getByRole("radio", { name: /5\.3 The Fundamental Theorem/ })).toBeChecked();
  await expect(page.getByRole("radio", { name: /Challenge/ })).toBeChecked();
  await expect(current(page, ".sidebar")).toHaveText("Study Plan");
  await expect(side.getByRole("link", { name: /MTH 263 Calculus/ })).toBeVisible();

  // The Dashboard's back button goes to the same place.
  await page.goto("/final-exam");
  const button = page.getByRole("link", { name: "Back to Integration Review" });
  await expect(button).toHaveAttribute("href", "/plan?section=5.3&level=challenge");
  await button.click();
  await expect(page).toHaveURL(/\/plan\?section=5\.3&level=challenge$/);
});

test("opened directly, Integration Review falls back to the regular Dashboard", async ({ page, context }) => {
  await signIn(page, "Fern", "Directtest");
  await context.clearCookies({ name: "mth_return" });
  await page.goto("/final-exam/review");
  await expect(current(page, ".sidebar")).toHaveText("Review Queue");
  await page.locator(".sidebar").getByRole("link", { name: "Integration Review" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(current(page, ".sidebar")).toHaveText("Dashboard");
  // The regular Dashboard is unchanged by the Final Exam.
  await expect(page.getByText("Your Exam 4 preparation at a glance.")).toBeVisible();
});

test("the Final Exam keeps its own study schedule", async ({ page }) => {
  await signIn(page, "Fern", "Scheduletest");
  await page.goto("/final-exam/settings");
  await expect(page.getByRole("heading", { name: "Final Exam study schedule" })).toBeVisible();
  await page.getByRole("link", { name: "Change schedule" }).click();
  await expect(page).toHaveURL(/\/final-exam\/schedule$/);
  await expect(current(page, ".sidebar")).toHaveText("Settings");
  await page.getByLabel("Saturday").check();
  await page.getByRole("button", { name: "Save schedule" }).click();
  await expect(page.getByText("Schedule saved.")).toBeVisible();
  // The regular schedule is untouched: still the default, not set up.
  await page.goto("/settings");
  await expect(page.getByRole("region", { name: "Study schedule" })).toContainText("Not set up yet");
  await page.goto("/final-exam/settings");
  await expect(page.getByRole("region", { name: "Final Exam study schedule" })).not.toContainText("Not set up yet");
});

test.describe("phone width (390px)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the top bar switches between the two environments and the tab bar follows", async ({ page }) => {
    await signIn(page, "Fern", "Phonetest");
    await page.goto("/review");
    const top = page.locator(".topbar");
    await top.getByRole("link", { name: "Final Exam" }).click();
    await expect(page).toHaveURL(/\/final-exam$/);
    await expect(current(page, ".tabbar")).toHaveText("Home");
    await expect(page.locator(".tabbar a")).toHaveCount(5);
    expect(await horizontalOverflow(page)).toBe(0);
    await page.locator(".tabbar").getByRole("link", { name: /Progress/ }).click();
    await expect(page).toHaveURL(/\/final-exam\/progress$/);
    const back = top.getByRole("link", { name: "Integration Review" });
    await expect(back).toHaveAttribute("href", "/review");
    await back.click();
    await expect(page).toHaveURL(/\/review$/);
    await expect(current(page, ".tabbar")).toContainText("Review");
  });
});

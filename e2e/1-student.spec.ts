import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test.describe.configure({ mode: "serial" });

test("sign-in validates names and creates the account", async ({ page }) => {
  await page.goto("/signin");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "first and last name" })).toBeVisible();
  await expect(page.getByLabel("First Name")).toHaveAttribute("aria-invalid", "true");

  await signIn(page, "Ada", "Lovelace");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ada");
  await expect(page.getByText("Exam 4", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Start Studying/ })).toBeVisible();
});

test("practice: hint, answer and worked solution are logged; Lost serves an easier problem", async ({ page }) => {
  await signIn(page, "Ada", "Lovelace");
  await page.getByRole("link", { name: /Start Studying/ }).click();
  await expect(page).toHaveURL(/\/practice\/4\.10-/);
  await expect(page.getByText("Question 1 of 15")).toBeVisible();

  const hint = page.getByRole("button", { name: "Get a Hint" });
  await hint.click();
  await expect(hint).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("region", { name: "Hints" })).toBeVisible();

  const answer = page.getByRole("button", { name: "Reveal Answer" });
  await answer.click();
  await expect(page.getByRole("region", { name: "Answer" })).toBeVisible();

  const solution = page.getByRole("button", { name: /Worked Solution/ });
  await solution.click();
  const dialog = page.getByRole("dialog", { name: "Worked Solution" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/Step 1 of \d/)).toBeVisible();
  await dialog.getByRole("button", { name: "Next step" }).click();
  await expect(dialog.getByText(/Step 2 of \d/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(solution).toBeFocused();

  const details = page.getByRole("region", { name: "Attempt Details" });
  await expect(details).toContainText("1 of");
  await expect(details.getByText("Yes")).toHaveCount(2);

  // Rating saves, then opens the next problem by itself: no feedback panel, no "Next problem" button.
  await page.getByRole("button", { name: /^Lost/ }).click();
  await expect(page).toHaveURL(/\/practice\/4\.10-.+\?item=/);
  await expect(page.getByText("Easier problem on the same idea")).toBeVisible();
  await expect(page.getByRole("link", { name: /Try an easier problem|Next problem/ })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /Review Queue\s*1 due/ })).toBeVisible();

  await page.getByRole("button", { name: /^Got it/ }).click();
  await expect(page).toHaveURL(/\/practice\/4\.10-[^?]+$/);
  await expect(page.getByRole("link", { name: "Next problem" })).toHaveCount(0);
});

test("review queue, progress and notes reflect the ratings", async ({ page }) => {
  await signIn(page, "Ada", "Lovelace");
  await page.goto("/review");
  await expect(page.getByRole("heading", { name: /Tomorrow/ })).toBeVisible();
  await expect(page.getByText("You marked this Lost")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Coming up/ })).toBeVisible();

  await page.goto("/progress");
  await expect(page.getByText("Problems attempted")).toBeVisible();
  await expect(page.getByRole("img", { name: /You rated 50% of your problems Got it/ })).toBeVisible();

  await page.goto("/plan?section=4.10&level=foundation");
  await page.getByRole("link", { name: /^Exercise|^Practice/ }).first().click();
  const notes = page.getByLabel("Notes");
  await notes.fill("power rule: add one, divide by the new power");
  await notes.blur();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Notes")).toHaveValue("power rule: add one, divide by the new power");
});

test("theme choice persists and sign-out protects pages", async ({ page }) => {
  await signIn(page, "Ada", "Lovelace");
  await page.goto("/settings");
  await page.getByLabel(/Dark/).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByLabel(/System/).check();

  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/signin$/);
});

test("the same name (any capitals or spacing) returns to the same account", async ({ page }) => {
  await signIn(page, "  ada ", "LOVELACE");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ada");
  await expect(page.getByText("Recent Activity")).toBeVisible();
  await expect(page.getByRole("link", { name: /Continue Studying/ })).toBeVisible();
});

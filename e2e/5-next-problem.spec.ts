import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test.describe.configure({ mode: "serial" });

/** Opens the first practice problem from the plan (the app sets up a schedule first if needed). */
async function openFirstProblem(page: import("@playwright/test").Page) {
  await page.goto("/practice/4.10-481");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

test("a double-click on a rating advances exactly one problem", async ({ page }) => {
  await signIn(page, "Grace", "Hopper");
  await openFirstProblem(page);
  const start = page.url();
  const got = page.getByRole("button", { name: /^Got it/ });
  await got.dblclick();
  await expect(page).not.toHaveURL(start);
  await expect(page.getByRole("link", { name: "Next problem" })).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "Nice work" })).toHaveCount(0);

  // The history shows one rating for the first problem.
  await page.goto("/progress");
  await expect(page.getByText("Problems attempted")).toBeVisible();
});

test("if saving fails the student stays on the problem and can retry", async ({ page }) => {
  await signIn(page, "Grace", "Hopper");
  await openFirstProblem(page);
  const start = page.url();
  // Let the page start its attempt first, so only the rating save is blocked below.
  await page.waitForLoadState("networkidle");

  // Block the server action that saves a rating (server actions are POSTs with a Next-Action header).
  let block = true;
  await page.route("**/practice/**", (route) => {
    const req = route.request();
    if (block && req.method() === "POST" && req.headers()["next-action"]) return route.abort();
    return route.continue();
  });

  await page.getByRole("button", { name: /^Shaky/ }).click();
  await expect(page.getByRole("alert").filter({ hasText: "rating wasn't saved" })).toBeVisible();
  await expect(page).toHaveURL(start);
  await expect(page.getByRole("button", { name: /^Shaky/ })).toBeEnabled();

  block = false;
  await page.getByRole("button", { name: /^Shaky/ }).click();
  await expect(page).not.toHaveURL(start);
});

import { expect, test } from "@playwright/test";
import { E2E_ADMIN_CODE } from "../playwright.config";
import { adminSignIn, appAlert } from "./helpers";

test.describe.configure({ mode: "serial" });

test("admin pages require the access code", async ({ page, request }) => {
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/admin$/);
  const csv = await request.get("/admin/export");
  expect(csv.status()).toBe(401);
});

test("admin sees the class, a student's history, and can export CSV", async ({ page }) => {
  await adminSignIn(page, E2E_ADMIN_CODE);
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Class Overview" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Lovelace, Ada" }).first()).toBeVisible();

  await page.getByRole("link", { name: "Lovelace, Ada" }).first().click();
  await expect(page.getByRole("heading", { name: "Student: Ada Lovelace" })).toBeVisible();
  await expect(page.getByRole("table").last()).toContainText("Lost");

  const res = await page.request.get("/admin/export");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");
  expect(await res.text()).toContain("Lovelace");
});

test("problem bank filters and the editor previews math", async ({ page }) => {
  await adminSignIn(page, E2E_ADMIN_CODE);
  await page.goto("/admin/problems?section=5.5&difficulty=Ch");
  await expect(page.getByText(/^\d+ problems?$/)).toBeVisible();
  await page.getByRole("link", { name: /Edit 5\.5-271/ }).click();
  await expect(page.getByRole("heading", { name: "Edit 5.5-271" })).toBeVisible();
  const statement = page.getByLabel("Problem statement");
  await statement.fill("Evaluate $$\\int x\\,dx$$");
  await expect(page.locator(".preview-pane .katex").first()).toBeVisible();
});

test("study plan builder rejects counts larger than the pool", async ({ page }) => {
  await adminSignIn(page, E2E_ADMIN_CODE);
  await page.goto("/admin/plan");
  await page.getByLabel(/4\.10 Foundation problems/).fill("99");
  await page.getByRole("button", { name: "Save plan" }).click();
  await expect(appAlert(page)).toContainText("only");
});

test("exam settings reach the student dashboard", async ({ page }) => {
  await adminSignIn(page, E2E_ADMIN_CODE);
  await page.goto("/admin/settings");
  await page.getByLabel("Exam name").fill("Exam 4 (rescheduled)");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(/Saved\. Students see/)).toBeVisible();

  // Student and admin sessions use separate cookies, so the same browser can sign in as a student.
  await page.goto("/signin");
  await page.getByLabel("First Name").fill("Ada");
  await page.getByLabel("Last Name").fill("Lovelace");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Exam 4 (rescheduled)").first()).toBeVisible();

  await page.goto("/admin/settings");
  await page.getByLabel("Exam name").fill("Exam 4");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(/Saved\. Students see/)).toBeVisible();
});

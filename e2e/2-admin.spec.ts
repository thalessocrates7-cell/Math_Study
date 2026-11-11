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
  // Two forms on the page: Exam 4's, and the Final Exam's own name, date and start time.
  const exam = page.getByRole("region", { name: "Exam", exact: true });
  const final = page.getByRole("region", { name: "Final Exam", exact: true });
  await exam.getByLabel("Exam name").fill("Exam 4 (rescheduled)");
  await exam.getByRole("button", { name: "Save" }).click();
  await expect(exam.getByText(/Saved\. Students see/)).toBeVisible();
  await final.getByLabel("Start time").fill("15:30");
  await final.getByRole("button", { name: "Save" }).click();
  await expect(final.getByText(/Saved\. The Final Exam countdown/)).toBeVisible();

  // Student and admin sessions use separate cookies, so the same browser can sign in as a student.
  await page.goto("/signin");
  await page.getByLabel("First Name").fill("Ada");
  await page.getByLabel("Last Name").fill("Lovelace");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Exam 4 (rescheduled)").first()).toBeVisible();
  // The Final Exam shows its own time, and nothing of Exam 4.
  await page.goto("/final-exam");
  await expect(page.getByRole("region", { name: "Final Exam", exact: true })).toContainText("3:30 PM");
  await expect(page.getByText("Exam 4 (rescheduled)")).toHaveCount(0);

  await page.goto("/admin/settings");
  await exam.getByLabel("Exam name").fill("Exam 4");
  await exam.getByRole("button", { name: "Save" }).click();
  await expect(exam.getByText(/Saved\. Students see/)).toBeVisible();
  await final.getByLabel("Start time").fill("14:00");
  await final.getByRole("button", { name: "Save" }).click();
  await expect(final.getByText(/Saved\. The Final Exam countdown/)).toBeVisible();
});

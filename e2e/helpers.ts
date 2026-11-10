import { expect, type Page } from "@playwright/test";

export async function signIn(page: Page, first: string, last: string) {
  await page.goto("/signin");
  await page.getByLabel("First Name").fill(first);
  await page.getByLabel("Last Name").fill(last);
  await page.getByRole("button", { name: "Continue" }).click();
  // A new student is first sent to set up a schedule; saving the default one lands on the dashboard.
  await expect(page).toHaveURL(/\/(dashboard|schedule\?setup=1)$/);
  if (page.url().includes("/schedule")) {
    await page.getByRole("button", { name: "Save and see today's plan" }).click();
  }
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** Submits an admin code without waiting (for wrong-code tests). */
export async function adminTry(page: Page, code: string) {
  await page.goto("/admin");
  await page.getByLabel("Access Code").fill(code);
  await page.getByRole("button", { name: "Sign In" }).click();
}

/** Signs in as admin and waits until the dashboard has loaded (so the session cookie is set). */
export async function adminSignIn(page: Page, code: string) {
  await adminTry(page, code);
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
}

/** The app's own error alert (Next.js also renders an empty role=alert route announcer). */
export function appAlert(page: Page) {
  return page.locator(".alert[role='alert']");
}

/** Width of the page beyond the viewport (should be 0: no horizontal page scroll). */
export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

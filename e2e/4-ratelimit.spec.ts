import { expect, test } from "@playwright/test";
import { E2E_ADMIN_CODE } from "../playwright.config";
import { adminTry, appAlert } from "./helpers";

// Runs last: it locks admin sign-in for this throwaway server for 15 minutes.
test("five wrong admin codes lock sign-in, even for the right code", async ({ page }) => {
  for (let i = 0; i < 5; i++) {
    await adminTry(page, `wrong-code-${i}`);
    await expect(appAlert(page)).toContainText(/not correct|Too many/);
  }
  await adminTry(page, E2E_ADMIN_CODE);
  await expect(appAlert(page)).toContainText("Too many attempts");
  await expect(page).toHaveURL(/\/admin$/);
});

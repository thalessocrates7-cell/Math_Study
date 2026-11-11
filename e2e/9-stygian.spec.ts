import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./helpers";

// The Stygian look ("The Forgotten Library"): the default for everyone, whatever the device prefers;
// the light look is a saved choice; the library picture sits behind the Dashboard header (Stygian
// only), and every web copy of it loads.

test.use({ colorScheme: "light" });

/** The picture layer behind the page header ("none" on pages without one). */
const picture = (page: Page) => page.evaluate(() => getComputedStyle(document.querySelector("main")!, "::before").backgroundImage);
const css = (page: Page, selector: string, property: string) =>
  page.evaluate(([s, p]) => getComputedStyle(document.querySelector(s)!).getPropertyValue(p), [selector, property] as const);

test("Stygian by default; the light look is saved and drops the decoration", async ({ page }) => {
  await signIn(page, "Stella", "Stygian");
  const html = page.locator("html");
  await expect(html).not.toHaveAttribute("data-theme", /./);
  expect(await css(page, "body", "background-color")).toBe("rgb(11, 8, 11)");
  expect(await css(page, "h1", "font-family")).toMatch(/Playfair/);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#0b080b");

  // The library behind both Dashboards' headers (mirrored on the Final Exam's), and on no other page.
  expect(await picture(page)).toMatch(/bg_01_forgotten_library_main-1536\.(avif|webp)/);
  await page.goto("/final-exam");
  expect(await picture(page)).toMatch(/bg_01_forgotten_library_main-1536\.(avif|webp)/);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector("main")!, "::before").transform)).toBe("matrix(-1, 0, 0, 1, 0, 0)");
  await page.goto("/plan");
  expect(await picture(page)).toBe("none");

  // Every web copy of the picture loads.
  for (const width of [768, 1536]) {
    for (const ext of ["webp", "avif"]) {
      const response = await page.request.get(`/stygian/bg_01_forgotten_library_main-${width}.${ext}`);
      expect(response.status(), `${width}.${ext}`).toBe(200);
    }
  }

  // The light look, chosen with the sidebar switch: saved, with Inter titles and no picture.
  await page.goto("/dashboard");
  await page.locator(".sidebar").getByRole("switch", { name: "Dark Mode" }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");
  expect(await css(page, "body", "background-color")).toBe("rgb(247, 248, 250)");
  expect(await css(page, "h1", "font-family")).toMatch(/^Inter/);
  expect(await picture(page)).toBe("none");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#f7f8fa");
});

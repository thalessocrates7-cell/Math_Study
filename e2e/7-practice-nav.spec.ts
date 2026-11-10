import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./helpers";

// The practice page's X and Previous / Next (reference_nav.png and the Practice Exit spec).

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const idOf = (href: string) => decodeURIComponent(href.split("/practice/")[1].split("?")[0]);

/** The problem links of one Study Plan list, in order. */
async function planList(page: Page, section: string, level: string) {
  await page.goto(`/plan?section=${section}&level=${level}`);
  const titles = page.locator(".check-row .check-title");
  await expect(titles.first()).toBeVisible();
  const hrefs = await titles.evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""));
  return { titles, hrefs, ids: hrefs.map(idOf) };
}

const pager = (page: Page) => page.getByRole("navigation", { name: "Problems in this list" });

test("from the Study Plan, Next and Previous walk the list and the ends lead back to the section", async ({ page }) => {
  await signIn(page, "Pat", "Pager");
  const { titles, hrefs, ids } = await planList(page, "5.1", "core");
  const n = hrefs.length;
  expect(n).toBeGreaterThan(2);

  await titles.nth(0).click();
  await expect(page).toHaveURL(new RegExp(`${escapeRe(hrefs[0])}$`));
  await expect(pager(page).getByText(`Core 1 of ${n}`)).toBeVisible();

  await pager(page).getByRole("link", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${escapeRe(hrefs[1])}$`));
  await expect(pager(page).getByText(`Core 2 of ${n}`)).toBeVisible();

  await pager(page).getByRole("link", { name: "Previous", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${escapeRe(hrefs[0])}$`));

  // Previous on the first problem does what X does: back to the section, on that problem's row.
  await pager(page).getByRole("link", { name: "Previous: back to 5.1 Core in the Study Plan" }).click();
  await expect(page).toHaveURL(new RegExp(`/plan\\?section=5\\.1&level=core#p-${escapeRe(ids[0])}$`));
  const first = page.locator(`[id="p-${ids[0]}"]`);
  await expect(first).toBeInViewport();
  await expect(first).toHaveAttribute("data-returned", "true");

  // Next on the last problem does the same.
  await titles.nth(n - 1).click();
  await expect(pager(page).getByText(`Core ${n} of ${n}`)).toBeVisible();
  await pager(page).getByRole("link", { name: "Next: back to 5.1 Core in the Study Plan" }).click();
  await expect(page).toHaveURL(new RegExp(`#p-${escapeRe(ids[n - 1])}$`));
  await expect(page.locator(`[id="p-${ids[n - 1]}"]`)).toBeInViewport();
});

test("X on a Study Plan problem returns to that problem's row, with nothing rated or ticked", async ({ page }) => {
  await signIn(page, "Pat", "Pager");
  const { titles, ids } = await planList(page, "5.1", "core");
  await titles.nth(2).click();
  await page.getByRole("link", { name: "Exit practice, back to 5.1 Core in the Study Plan" }).click();
  await expect(page).toHaveURL(new RegExp(`/plan\\?section=5\\.1&level=core#p-${escapeRe(ids[2])}$`));
  const row = page.locator(`[id="p-${ids[2]}"]`);
  await expect(row).toBeInViewport();
  await expect(row.getByRole("checkbox")).not.toBeChecked();
});

test("a Review Queue problem's X returns to its own section; it has no Previous / Next", async ({ page }) => {
  await signIn(page, "Rae", "Review");
  const { titles } = await planList(page, "4.10", "core");
  await titles.first().click();
  // Lost opens an easier problem on the same idea as a review item (?item=).
  await page.getByRole("button", { name: /^Lost/ }).click();
  await expect(page).toHaveURL(/\/practice\/4\.10-[^?]+\?item=/);
  await expect(pager(page)).toHaveCount(0);
  const id = idOf(page.url().replace(/^https?:\/\/[^/]+/, ""));
  const exit = page.getByRole("link", { name: /^Exit practice, back to 4\.10 / });
  await expect(exit).toHaveAttribute("href", new RegExp(`^/plan\\?section=4\\.10&level=(foundation|core|challenge)#p-${escapeRe(id)}$`));
  await exit.click();
  await expect(page.locator(`[id="p-${id}"]`)).toBeInViewport();
});

test("a problem from today's session: X goes back to Today's Session, and there is no Previous / Next", async ({ page }) => {
  await signIn(page, "Sam", "Session");
  await page.getByRole("button", { name: /Start Studying/ }).click();
  await expect(page).toHaveURL(/\/practice\/[^?]+\?s=/);
  await expect(pager(page)).toHaveCount(0);
  await page.getByRole("link", { name: "Exit practice, back to Today's Session" }).click();
  await expect(page).toHaveURL(/\/session$/);
});

test.describe("phone width (390px)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("X and the Previous / Next buttons fit and are at least 44px tall", async ({ page }) => {
    await signIn(page, "Pat", "Phone");
    const { titles } = await planList(page, "5.1", "core");
    await titles.nth(1).click();
    const boxes = await Promise.all(
      [page.getByRole("link", { name: /^Exit practice/ }), pager(page).getByRole("link", { name: "Previous", exact: true }), pager(page).getByRole("link", { name: "Next", exact: true })].map((l) =>
        l.boundingBox(),
      ),
    );
    for (const b of boxes) {
      expect(b).not.toBeNull();
      expect(b!.height).toBeGreaterThanOrEqual(44);
      expect(b!.x + b!.width).toBeLessThanOrEqual(390);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });
});

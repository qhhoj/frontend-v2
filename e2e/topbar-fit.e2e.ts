import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/api';
import { adminList, adminOk, signInAsStaff } from './fixtures/admin';
import { EMPTY_JUDGE_QUEUE } from '../src/test/admin-fixtures/judges';

/** Behaviour: at every width the top bar fits the viewport; the page never scrolls sideways and no bar control is cut off. */
const WIDTHS = [320, 360, 390, 768, 800, 900, 1024, 1280, 1440];

async function expectBarFits(page: Page, bar: string) {
  const overflow = await page.evaluate((selector) => {
    const root = document.documentElement;
    const header = document.querySelector(selector);
    const cut = [...(header?.querySelectorAll('a, button') ?? [])]
      .filter(
        (el) =>
          el.getClientRects().length > 0 &&
          el.getBoundingClientRect().right > innerWidth + 1 &&
          !el.closest('.overflow-x-auto'),
      )
      .map((el) => el.textContent?.trim() || el.getAttribute('aria-label'));
    return { page: root.scrollWidth - innerWidth, cut };
  }, bar);
  expect(overflow.page).toBeLessThanOrEqual(0);
  expect(overflow.cut).toEqual([]);
}

for (const width of WIDTHS) {
  test(`the admin top bar fits at ${width}px`, async ({ page, api }) => {
    await page.setViewportSize({ width, height: 800 });
    signInAsStaff(api, [], true);
    api.routes['GET /judges/queue'] = adminOk(EMPTY_JUDGE_QUEUE);
    api.routes['GET /tickets/summary'] = adminOk({ assignedOpen: 1, awaitingStaff: 3 });
    api.routes['GET /comments/reports'] = adminList([], { total: 2 });
    api.routes['GET /admin/organization-requests'] = adminList([], { total: 4 });
    api.routes['GET /admin/audit'] = adminOk({ items: [], nextBefore: null });
    api.routes['GET /admin/users'] = adminList([]);
    await page.goto('/admin');
    await expect(page.getByTestId('admin-topbar')).toBeVisible();
    const shots = process.env.SHOTS_DIR;
    if (shots) await page.screenshot({ path: `${shots}/admin-${width}.png` });
    await expectBarFits(page, '[data-testid="admin-topbar"]');
    const badge = page.getByTestId('admin-staff-badge');
    if (await badge.isVisible()) expect((await badge.boundingBox())?.height).toBeLessThan(32);
  });

  test(`the public top bar fits at ${width}px`, async ({ page, api }) => {
    await page.setViewportSize({ width, height: 800 });
    signInAsStaff(api, [], true);
    await page.goto('/problems');
    await expect(page.locator('header').first()).toBeVisible();
    const shots = process.env.SHOTS_DIR;
    if (shots) await page.screenshot({ path: `${shots}/public-${width}.png` });
    await expectBarFits(page, 'header');
  });
}

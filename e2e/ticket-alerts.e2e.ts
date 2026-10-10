import { sessionResponse, sessionUser } from '../src/test/fixtures';
import { THEMES } from '../src/theme/registry';
import { expect, list, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { applyTheme, AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { ok } from './fixtures/reply';
import type { Page } from '@playwright/test';

const asHandler = (api: FakeApi, assignedOpen: number, awaitingStaff: number) => {
  api.signedIn = true;
  api.routes['GET /auth/me'] = ok(
    sessionResponse({ user: sessionUser({ isStaff: true, permissions: ['judge.change_ticket'] }) }),
  );
  api.routes['GET /tickets'] = list([]);
  api.routes['GET /tickets/summary'] = ok({ assignedOpen, awaitingStaff });
};
const strip = (page: Page) => page.getByRole('region', { name: 'Phiếu cần xử lý' });

test("the canned-reply screen is reached from the ticket queue header (moved here from lane C: the link is lane B's file)", async ({
  page,
  api,
}) => {
  asHandler(api, 0, 0);
  api.routes['GET /ticket-canned-replies'] = list([]);
  await page.goto('/admin/tickets');
  await page.getByRole('link', { name: 'Mẫu trả lời' }).click();
  await expect(page).toHaveURL(/\/admin\/tickets\/canned$/);
});

test('a handler sees both counts and reaches the queue from the strip', async ({ page, api }) => {
  asHandler(api, 2, 5);
  await page.goto('/tickets');
  await expect(
    strip(page).getByRole('link', { name: '2 phiếu đang mở giao cho bạn' }),
  ).toBeVisible();
  await expect(
    strip(page).getByRole('link', { name: '5 phiếu đang chờ nhân viên trả lời' }),
  ).toHaveAttribute('href', '/admin/tickets?scope=all&open=1');
  await expect(strip(page).locator('[data-testid="inline-bit"]')).toBeVisible();
});

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
    test(`the alerts strip has no WCAG 2.1 A/AA violations in ${theme.id}, ${viewport.name}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      asHandler(api, 2, 5);
      await applyTheme(page, api, theme);
      await page.goto('/tickets');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
      await expect(strip(page)).toBeVisible();
      expect(await axeViolationsIn(page)).toEqual([]);
    });

test('the strip does not make /tickets scroll sideways at 375 px', async ({ page, api }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  asHandler(api, 12, 345);
  await page.goto('/tickets');
  await expect(strip(page)).toBeVisible();
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
});

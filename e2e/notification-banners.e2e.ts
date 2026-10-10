import type { Page } from '@playwright/test';
import { notificationItem, NOTIFICATION_NOW } from '../src/test/notification-fixtures';
import { THEMES } from '../src/theme/registry';
import { expect, list, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { applyTheme, AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { ok } from './fixtures/reply';

const important = notificationItem({
  id: 'n-high',
  path: '/notifications',
  title: 'Phiếu hỗ trợ có trả lời mới',
});

function withImportant(api: FakeApi) {
  api.signedIn = true;
  let isRead = false;
  api.routes['GET /notifications'] = ({ url }) =>
    list(url.searchParams.get('priority') === 'high' && !isRead ? [important] : []);
  api.routes['POST /notifications/n-high/read'] = () => {
    isRead = true;
    return { status: 204 };
  };
}
const withOfficialMode = (api: FakeApi) => {
  api.signedIn = true;
  api.routes['GET /site'] = ok({ config: {}, officialMode: true });
};
const highBanner = (page: Page) => page.getByRole('region', { name: 'Thông báo quan trọng' });
const officialBanner = (page: Page) => page.getByRole('region', { name: 'Chế độ thi chính thức' });

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOTIFICATION_NOW);
});

test('the important banner leaves once marked read', async ({ page, api }) => {
  withImportant(api);
  await page.goto('/blog');
  await expect(highBanner(page)).toContainText(important.title);
  await highBanner(page).getByRole('button', { name: 'Đánh dấu đã đọc' }).click();
  await expect(highBanner(page)).toBeHidden();
  expect(api.requestsTo('POST /notifications/n-high/read')).toHaveLength(1);
});

test('official mode shows the pill beside the logo and the warning banner with the padlock Bit', async ({
  page,
  api,
}) => {
  withOfficialMode(api);
  await page.goto('/blog');
  await expect(page.getByTestId('official-pill')).toHaveText('Thi chính thức');
  await expect(officialBanner(page)).toContainText('phiếu hỗ trợ vẫn dùng được');
  await expect(officialBanner(page).locator('[data-testid="inline-bit"]')).toBeVisible();
});

test('an anonymous visitor sees no official banner and sends no /site request', async ({
  page,
  api,
}) => {
  api.routes['GET /site'] = ok({ config: {}, officialMode: true });
  await page.goto('/blog');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(officialBanner(page)).toHaveCount(0);
  expect(api.requestsTo('GET /site')).toHaveLength(0);
});

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
    test(`both banners have no WCAG 2.1 A/AA violations in ${theme.id}, ${viewport.name}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      withImportant(api);
      withOfficialMode(api);
      await applyTheme(page, api, theme);
      await page.goto('/blog');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
      await expect(highBanner(page)).toBeVisible();
      await expect(officialBanner(page)).toBeVisible();
      expect(await axeViolationsIn(page)).toEqual([]);
    });

test('the banners and the pill do not make the page scroll sideways at 375 px', async ({
  page,
  api,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  withImportant(api);
  withOfficialMode(api);
  await page.goto('/blog');
  await expect(highBanner(page)).toBeVisible();
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
});

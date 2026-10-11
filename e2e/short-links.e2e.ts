import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';

const PROBLEM = '/problems/duongdi';
const BUTTON = 'short-link-button';
const grantClipboard = (page: Page) =>
  page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
const signIn = (api: FakeApi) => (api.signedIn = true);

test('copies the problem short link and announces it', async ({ page, api }) => {
  signIn(api);
  await grantClipboard(page);
  await page.goto(PROBLEM);
  await page.getByTestId(BUTTON).click();
  await expect(page.getByTestId(BUTTON)).toHaveAttribute('aria-label', 'Đã sao chép');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/\/s\/k7m2xq$/);
  expect(api.requestsTo('POST /short-links')).toHaveLength(1);
});

test('the 429 locks the button with the daily limit and the sweating Bit', async ({
  page,
  api,
}) => {
  signIn(api);
  api.routes['POST /short-links'] = {
    status: 429,
    headers: { 'Retry-After': '3600' },
    body: { error: { code: 'rate_limited', message: 'limit' } },
  };
  await page.goto(PROBLEM);
  await page.getByTestId(BUTTON).click();
  const alert = page.getByTestId('short-link').getByRole('alert');
  await expect(alert).toContainText('tối đa 20 liên kết ngắn');
  await expect(alert.getByTestId('inline-bit')).toBeVisible();
});

test('a short-link visitor on a hidden page reads why', async ({ page, api }) => {
  signIn(api);
  api.routes['GET /problems/secret'] = {
    status: 404,
    body: { error: { code: 'not_found', message: 'nf' } },
  };
  await page.addInitScript(() => {
    const original = performance.getEntriesByType.bind(performance);
    performance.getEntriesByType = (type: string) =>
      type === 'navigation'
        ? ([{ redirectCount: 1, name: location.href }] as unknown as PerformanceEntryList)
        : original(type);
  });
  await page.goto('/problems/secret');
  await expect(page.getByTestId('short-link-hint')).toHaveText(
    'Bạn có thể không có quyền xem trang này.',
  );
});

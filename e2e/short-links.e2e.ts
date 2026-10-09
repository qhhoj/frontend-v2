import { problemDetail } from '../src/test/fixtures';
import type { Locator, Page } from '@playwright/test';
import { THEMES } from '../src/theme/registry';
import { CONTEST_FIXTURE_NOW, expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { AUDIT_VIEWPORTS, applyTheme, axeViolationsIn } from './fixtures/audit';
import { PHONE_AND_DESKTOP, defineShiftTests } from './fixtures/layout-shift';
import { ok } from './fixtures/reply';

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
  await expect(page.getByTestId(BUTTON)).toHaveText('Đã sao chép');
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

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
    test(`the problem header with the short-link button is accessible at ${viewport.name} in ${theme.id}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize(viewport);
      signIn(api);
      await grantClipboard(page);
      await applyTheme(page, api, theme);
      await page.goto(PROBLEM);
      await page.getByTestId(BUTTON).click();
      await expect(page.getByTestId(BUTTON)).toHaveText('Đã sao chép');
      expect(await axeViolationsIn(page)).toEqual([]);
    });

test('the full-width phone button never scrolls the page sideways', async ({ page, api }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  signIn(api);
  await page.goto('/contests/r42');
  await expect(page.getByTestId(BUTTON)).toBeVisible();
  const widths = await page.evaluate(() => ({
    button: document.querySelector('[data-testid="short-link-button"]')!.getBoundingClientRect()
      .width,
    page: document.documentElement.scrollWidth,
    view: innerWidth,
  }));
  expect(widths.page).toBeLessThanOrEqual(widths.view);
  expect(widths.button).toBeGreaterThan(widths.view / 2);
});

const bottomOf = (locator: Locator) =>
  locator.evaluate((element) => element.getBoundingClientRect().bottom);

test('the footer is not under the contest action bar on a phone', async ({ page, api }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  signIn(api);
  await page.goto('/contests/r42');
  await expect(page.getByTestId('contest-actions')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const bar = await page.getByTestId('contest-actions').boundingBox();
  const footerBottom = await bottomOf(page.getByTestId('low-power-footer'));
  expect(footerBottom).toBeLessThanOrEqual(bar!.y + 1);
});

test('the footer is not under the submit dock on the problem page', async ({ page, api }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  signIn(api);
  await page.goto(PROBLEM);
  const dock = page.getByRole('region', { name: 'Nộp bài' });
  await expect(dock).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const box = await dock.boundingBox();
  const footerBottom = await bottomOf(page.getByTestId('low-power-footer'));
  expect(footerBottom).toBeLessThanOrEqual(box!.y + 1);
});

defineShiftTests([
  {
    name: 'problem header with the short-link button',
    path: PROBLEM,
    signedIn: true,
    hold: 'GET /problems/duongdi',
    // A title of two phone lines: the skeleton draws two, and the button then sits on its own row.
    answer: (api) => {
      api.routes['GET /problems/:code'] = ({ params }) =>
        ok(problemDetail({ code: params.code, name: 'Đường đi qua mê cung' }));
    },
    parts: (page) => ({ 'problem header': page.getByTestId('problem-header') }),
    viewports: PHONE_AND_DESKTOP,
  },
  {
    name: 'contest header with the short-link button',
    path: '/contests/r42',
    signedIn: true,
    hold: 'GET /contests/r42',
    clockAt: CONTEST_FIXTURE_NOW,
    parts: (page) => ({
      header: page.locator(
        '[data-skeleton-region="contest-header"], [data-testid="contest-header"]',
      ),
    }),
    viewports: PHONE_AND_DESKTOP,
  },
]);

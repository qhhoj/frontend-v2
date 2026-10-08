import type { Page } from '@playwright/test';
import { ok } from './fixtures/reply';
import { organizationSummary } from '../src/test/community-fixtures';
import { userPage } from '../src/test/fixtures';
import { THEMES } from '../src/theme/registry';
import { applyTheme, AUDIT_VIEWPORTS, expectNoAxeViolations } from './fixtures/audit';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { defineShiftTests, PHONE, DESKTOP, PHONE_AND_DESKTOP } from './fixtures/layout-shift';
import type { ShiftCase } from './fixtures/layout-shift';

const OWN = '/users/user_01';
const OTHER = '/users/ngoc_anh';
const UNKNOWN = '/users/nguoi_la';
const NOT_FOUND = { status: 404, body: { error: { code: 'not_found', message: '' } } };
const runningCssAnimations = (page: Page) =>
  page.evaluate(
    () => document.getAnimations().filter((animation) => animation instanceof CSSAnimation).length,
  );
const fitsWithoutSideScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

/** Two organizations, so the loaded header has the chip row the skeleton draws. */
const withOrganizations = (api: FakeApi) => {
  api.routes['GET /users/user_01'] = ok(
    userPage({
      organizations: [
        organizationSummary(),
        organizationSummary({ slug: 'thcs', shortName: 'THCS', name: 'THCS Lê Lợi' }),
      ],
    }),
  );
};

test('on a phone the stats come before the rating chart and the page does not scroll sideways', async ({
  page,
  api,
}) => {
  await page.setViewportSize({ width: PHONE, height: 812 });
  api.signedIn = true;
  await page.goto(OWN);
  const stats = await page.getByTestId('profile-stats').boundingBox();
  const chart = await page.getByTestId('rating-card').boundingBox();
  expect(stats!.y).toBeLessThan(chart!.y);
  expect(await fitsWithoutSideScroll(page)).toBe(true);
});

test('an unknown user shows the crying Bit; its tears move only with motion', async ({
  page,
  api,
}) => {
  api.routes['GET /users/nguoi_la'] = NOT_FOUND;
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(UNKNOWN);
  await expect(page.locator('[data-state="notFound"]')).toBeVisible();
  await expect(page.locator('.bit-tear')).toHaveCount(2);
  expect(await runningCssAnimations(page)).toBeGreaterThanOrEqual(2);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await runningCssAnimations(page)).toBe(0);
});

const SHIFT_CASES: ShiftCase[] = [
  {
    name: 'profile header',
    path: OWN,
    signedIn: true,
    hold: 'GET /users/user_01',
    answer: withOrganizations,
    parts: (page) => ({ header: page.getByTestId('profile-header') }),
    viewports: PHONE_AND_DESKTOP,
  },
  {
    name: 'rating chart card',
    path: OWN,
    signedIn: true,
    hold: 'GET /users/user_01/ratings',
    answer: withOrganizations,
    parts: (page) => ({ chart: page.getByTestId('rating-card') }),
    viewports: [PHONE, DESKTOP],
  },
];
defineShiftTests(SHIFT_CASES);

for (const theme of THEMES)
  for (const viewport of AUDIT_VIEWPORTS) {
    const sized = `in ${theme.id}, ${viewport.name}`;
    test(`the own profile has no WCAG 2.1 A/AA violations ${sized}`, async ({ page, api }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      api.signedIn = true;
      await applyTheme(page, api, theme);
      await page.goto(OWN);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
      await expect(page.getByTestId('profile-header')).toBeVisible();
      await expectNoAxeViolations(page);
    });
    test(`another user's profile has no WCAG 2.1 A/AA violations ${sized}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await applyTheme(page, api, theme);
      await page.goto(OTHER);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
      await expect(page.getByTestId('profile-header')).toBeVisible();
      await expectNoAxeViolations(page);
    });
    test(`the not-found profile has no WCAG 2.1 A/AA violations ${sized}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      api.routes['GET /users/nguoi_la'] = NOT_FOUND;
      await applyTheme(page, api, theme);
      await page.goto(UNKNOWN);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await fitsWithoutSideScroll(page)).toBe(true);
      await expectNoAxeViolations(page);
    });
  }

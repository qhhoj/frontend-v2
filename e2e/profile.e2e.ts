import type { Page } from '@playwright/test';
import { THEMES } from '../src/theme/registry';
import { applyTheme, AUDIT_VIEWPORTS, expectNoAxeViolations } from './fixtures/audit';
import { expect, test } from './fixtures/api';
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

/** Anonymous visitors on a profile without organizations: the common loaded shape the skeleton draws. */
const SHIFT_CASES: ShiftCase[] = [
  {
    name: 'profile header',
    path: OTHER,
    signedIn: false,
    hold: 'GET /users/ngoc_anh',
    parts: (page) => ({ header: page.getByTestId('profile-header') }),
    viewports: PHONE_AND_DESKTOP,
  },
  {
    name: 'rating chart card',
    path: OTHER,
    signedIn: false,
    hold: 'GET /users/ngoc_anh/ratings',
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

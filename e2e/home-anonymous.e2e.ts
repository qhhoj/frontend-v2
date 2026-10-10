import AxeBuilder from '@axe-core/playwright';
import { contestItem } from '../src/test/fixtures';
import { homeResponse } from '../src/test/community-fixtures';
import { THEMES } from '../src/theme/registry';
import { expect, list, test } from './fixtures/api';
import { DESKTOP, PHONE, PHONE_AND_DESKTOP, defineShiftTests } from './fixtures/layout-shift';

const READY = 'Quốc Học Huế Online Judge';

for (const theme of THEMES)
  for (const viewport of [
    { name: 'desktop', width: DESKTOP, height: 800 },
    { name: 'phone 375 px', width: PHONE, height: 812 },
  ])
    test(`the anonymous home has no WCAG 2.1 A/AA violations in ${theme.id}, ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.emulateMedia({ colorScheme: theme.scheme });
      await page.addInitScript((id) => localStorage.setItem('qhhoj.theme', id), theme.id);
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
      await expect(page.getByRole('heading', { level: 1, name: READY })).toBeVisible();
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(violations).toEqual([]);
    });

test('the anonymous home does not scroll sideways on a phone', async ({ page, api }) => {
  await page.setViewportSize({ width: PHONE, height: 812 });
  api.signedIn = false;
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: READY })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

defineShiftTests([
  {
    name: 'running contests card',
    path: '/',
    signedIn: false,
    hold: 'GET /contests',
    answer: (api) => {
      api.routes['GET /contests'] = list([
        contestItem(),
        contestItem({ key: 'r43', name: 'QHH Round #43' }),
      ]);
    },
    parts: (page) => ({
      'running contests': page.locator(
        '[data-skeleton-region="running-contest"], [data-testid="running-contests"] article',
      ),
    }),
    viewports: PHONE_AND_DESKTOP,
  },
  {
    name: 'hero counts',
    path: '/',
    signedIn: false,
    hold: 'GET /home',
    answer: (api) => {
      api.routes['GET /home'] = { body: { data: homeResponse() } };
    },
    parts: (page) => ({
      'hero counts': page.locator('[data-skeleton-region="counts"], [data-testid="home-counts"]'),
    }),
    viewports: PHONE_AND_DESKTOP,
  },
]);

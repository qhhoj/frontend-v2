import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { THEMES } from '../src/theme/registry';
import { expect, test } from './fixtures/api';

const UNKNOWN = '/no/such/page';
const runningCssAnimations = (page: Page) =>
  page.evaluate(
    () => document.getAnimations().filter((animation) => animation instanceof CSSAnimation).length,
  );

test('an unknown path shows the 404 page with two focusable links and the path', async ({
  page,
  api,
}) => {
  api.signedIn = false;
  await page.goto(UNKNOWN);
  await expect(page.getByRole('heading', { level: 1, name: 'Không tìm thấy trang' })).toBeVisible();
  await expect(page.getByTestId('requested-path')).toHaveText(UNKNOWN);
  for (const name of ['Về trang chủ', 'Xem danh sách bài']) {
    const link = page.getByRole('main').getByRole('link', { name });
    await link.focus();
    await expect(link).toBeFocused();
  }
  await page.getByRole('main').getByRole('link', { name: 'Về trang chủ' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('with motion the sob and the falling tears run; with reduced motion nothing animates', async ({
  page,
  api,
}) => {
  api.signedIn = false;
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(UNKNOWN);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await runningCssAnimations(page)).toBeGreaterThanOrEqual(3); // sob + two tears
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await runningCssAnimations(page)).toBe(0);
});

for (const theme of THEMES)
  for (const viewport of [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'phone 375 px', width: 375, height: 812 },
  ])
    test(`the 404 page has no WCAG 2.1 A/AA violations and no horizontal scroll in ${theme.id}, ${viewport.name}`, async ({
      page,
      api,
    }) => {
      api.signedIn = false;
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.emulateMedia({ colorScheme: theme.scheme });
      await page.addInitScript((id) => localStorage.setItem('qhhoj.theme', id), theme.id);
      await page.goto(UNKNOWN);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(violations).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);
    });

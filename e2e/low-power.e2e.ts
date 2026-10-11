import type { Page } from '@playwright/test';
import { CONTEST_FIXTURE_NOW, expect, test } from './fixtures/api';

/** Runs after the FakeApi's strong-device script, so this device reports two cores. */
const weakDevice = (page: Page) =>
  page.addInitScript(() =>
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2, configurable: true }),
  );
const isPainted = (page: Page) =>
  page.evaluate(() => document.documentElement.hasAttribute('data-low-power'));

test('a weak device starts in low-power before the first paint: no blur on Glass, no blobs, a still Bit', async ({
  page,
  api,
}) => {
  await weakDevice(page);
  await page.addInitScript(() => localStorage.setItem('qhhoj.theme', 'glass-dark'));
  await page.goto('/settings/appearance');
  expect(await isPainted(page)).toBe(true);
  const style = await page.evaluate(() => ({
    blur: getComputedStyle(document.documentElement).getPropertyValue('--qh-blur').trim(),
    blobs: getComputedStyle(document.querySelector('.blob-field')!).display,
  }));
  expect(style).toEqual({ blur: '0px', blobs: 'none' });
  const loop = page.getByTestId('low-power-off').locator('[data-frame]');
  await page.waitForTimeout(1500);
  await expect(loop).toHaveAttribute('data-frame', '0');
  await expect(page.getByTestId('low-power-machine')).toHaveText('Máy này: đang bật');
  expect(api.unmatched).toEqual([]);
});

test('"Luôn bật" sticks across a reload and the footer says so', async ({ page }) => {
  await page.goto('/settings/appearance');
  await page.getByTestId('low-power-on').getByRole('radio').check();
  expect(await isPainted(page)).toBe(true);
  await page.reload();
  expect(await isPainted(page)).toBe(true);
  await expect(page.getByTestId('app-footer')).toContainText('Chế độ tiết kiệm: Bật');
});

test('the footer link opens the switch', async ({ page }) => {
  await page.goto('/blog');
  await page.getByTestId('low-power-footer').click();
  await expect(page).toHaveURL(/\/settings\/appearance#low-power$/);
  await expect(page.getByTestId('low-power-section')).toBeInViewport();
});

test('a running ranking is re-read after 60 s, not 30 s, in low-power mode', async ({
  page,
  api,
}) => {
  await page.clock.install({ time: CONTEST_FIXTURE_NOW });
  await page.addInitScript(() => localStorage.setItem('qhhoj.lowPower', 'on'));
  await page.goto('/contests/r42/ranking');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const reads = () => api.requestsTo('GET /contests/r42/ranking').length;
  const first = reads();
  await page.clock.fastForward(31_000);
  expect(reads()).toBe(first);
  await page.clock.fastForward(30_000);
  await expect.poll(reads).toBe(first + 1);
});

test('the code editor is a plain textarea with the Tab hint in low-power mode', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  await page.addInitScript(() => localStorage.setItem('qhhoj.lowPower', 'on'));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/problems/duongdi');
  const dock = page.getByRole('region', { name: 'Nộp bài' });
  await expect(dock.getByTestId('editor-tab-hint')).toBeVisible();
  await expect(dock.locator('textarea')).toHaveCount(1);
  await expect(page.locator('.cm-editor')).toHaveCount(0);
});

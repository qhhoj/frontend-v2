import type { Locator } from '@playwright/test';
import { submissionDetail } from '../src/test/fixtures';
import { expect, test } from './fixtures/api';

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800, minBitPx: 112 },
  { name: 'phone', width: 375, height: 812, minBitPx: 64 },
] as const;

const boxOf = async (locator: Locator) => (await locator.boundingBox())!;
const overlaps = (first: Awaited<ReturnType<typeof boxOf>>, second: typeof first) =>
  first.x < second.x + second.width &&
  second.x < first.x + first.width &&
  first.y < second.y + second.height &&
  second.y < first.y + first.height;

for (const viewport of VIEWPORTS)
  for (const viewer of ['signed-in', 'anonymous'] as const)
    test(`the home Bit is big, beside the greeting text and never over it, ${viewer}, ${viewport.name}`, async ({
      page,
      api,
    }) => {
      api.signedIn = viewer === 'signed-in';
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      const bit = page.getByTestId('home-bit');
      await expect(bit).toBeVisible();
      const bitBox = await boxOf(bit);
      expect(bitBox.width).toBeGreaterThanOrEqual(viewport.minBitPx);
      const card = page.getByTestId(viewer === 'signed-in' ? 'rating-hero' : 'welcome-card');
      const texts = card.locator('p, h1, [data-testid="rating-row"]');
      for (const text of await texts.all()) expect(overlaps(bitBox, await boxOf(text))).toBe(false);
      const scrolls = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(scrolls).toBe(false);
    });

test('the home Bit keeps its box while it blinks', async ({ page, api }) => {
  api.signedIn = true;
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const bit = page.getByTestId('home-bit');
  const before = await boxOf(bit);
  const heroBefore = await boxOf(page.getByTestId('rating-hero'));
  await page.waitForTimeout(4400);
  expect(await boxOf(bit)).toEqual(before);
  expect(await boxOf(page.getByTestId('rating-hero'))).toEqual(heroBefore);
});

test('a final submission shows a crown on AC and a sweat drop on WA', async ({ page, api }) => {
  api.signedIn = true;
  api.routes['GET /submissions/:id'] = () => ({
    body: { data: submissionDetail({ result: 'AC', points: 1000 }) },
  });
  await page.goto('/submissions/sub-1');
  await expect(page.getByRole('img', { name: 'Bit đội vương miện' })).toBeVisible();
  api.routes['GET /submissions/:id'] = () => ({ body: { data: submissionDetail() } });
  await page.reload();
  await expect(page.getByRole('img', { name: 'Bit toát mồ hôi' })).toBeVisible();
});

test('an empty problem list shows Bit asleep above the message', async ({ page, api }) => {
  api.routes['GET /problems'] = {
    body: { data: [], meta: { page: 1, pageSize: 50, total: 0 } },
  };
  await page.goto('/problems');
  const asleep = page.getByRole('img', { name: 'Bit ngủ trong mũ ngủ' });
  await expect(asleep).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Không có bài phù hợp');
});

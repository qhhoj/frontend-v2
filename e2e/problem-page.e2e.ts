import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures/api';

const FOCUS_RING_REACH_PX = 4; // 2px outline + 2px offset
const boxOf = async (locator: Locator) => (await locator.boundingBox())!;

for (const width of [375, 1280])
  test.describe(`copy button on a sample at ${width} px`, () => {
    test('sits above the sample, covers none of it and its focus ring stays inside the statement', async ({
      page,
      api,
    }) => {
      void api; // installs the fake API
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: () => Promise.resolve() },
          configurable: true,
        });
      });
      await page.goto('/problems/duongdi');
      const button = page.locator('.statement button.copy-block').first();
      await expect(button).toBeVisible();
      await button.focus();
      const sample = await boxOf(page.locator('.statement pre').first());
      const key = await boxOf(button);
      expect(key.y + key.height, 'button ends above the sample').toBeLessThanOrEqual(sample.y);
      const statement = await boxOf(page.locator('.statement'));
      expect(key.x - FOCUS_RING_REACH_PX).toBeGreaterThanOrEqual(statement.x);
      expect(key.x + key.width + FOCUS_RING_REACH_PX).toBeLessThanOrEqual(
        statement.x + statement.width,
      );
      expect(key.y - FOCUS_RING_REACH_PX).toBeGreaterThanOrEqual(statement.y);
      expect(await button.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe(
        'solid',
      );
    });
  });

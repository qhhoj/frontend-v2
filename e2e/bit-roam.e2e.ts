import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/api';

/** The rules of src/mascot/bit-roam.ts, in px: 1.2 body widths between Bits, one body width around the pointer. */
const BODY = 64;
const GAP = 1.2 * BODY;

test.use({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });

/** Every roaming Bit's box (layer coordinates equal the viewport's: the layer is fixed at inset 0). */
const boxes = (page: Page) =>
  page.locator('[data-testid="roaming-bit"]').evaluateAll((bits) =>
    bits.map((bit) => {
      const rect = bit.getBoundingClientRect();
      return { x: rect.x, y: rect.y };
    }),
  );
const sample = async (
  page: Page,
  times: number,
  check: (boxes: Array<{ x: number; y: number }>) => void,
) => {
  for (let index = 0; index < times; index++) {
    check(await boxes(page));
    await page.waitForTimeout(100);
  }
};
const turnOnFive = async (page: Page) => {
  await page.goto('/settings/appearance');
  const card = page.getByTestId('bit-roam-section');
  await card.getByRole('switch', { name: 'Bit chạy quanh trang' }).click();
  // A drag fires `input` while it moves and `change` on release.
  await card.getByLabel('Số Bit').evaluate((slider: HTMLInputElement) => {
    slider.value = '5';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('[data-testid="roaming-bit"]')).toHaveCount(5);
};

test('a visitor turns the Bits on; they walk apart, keep off the pointer and never block clicks', async ({
  page,
  api,
}) => {
  await turnOnFive(page);
  await expect(page.getByTestId('roaming-bits')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.getByTestId('roaming-bits')).toHaveCSS('pointer-events', 'none');

  // Hops move the sprite up to 6 px, the same for every Bit only when both hop: allow that much.
  await sample(page, 20, (current) => {
    current.forEach((first, index) =>
      current
        .slice(index + 1)
        .forEach((second) =>
          expect(Math.hypot(first.x - second.x, first.y - second.y)).toBeGreaterThanOrEqual(
            GAP - 7,
          ),
        ),
    );
  });

  const pointer = { x: 720, y: 450 };
  await page.mouse.move(pointer.x, pointer.y);
  // A Bit already resting there may stay until the pointer has rested on it, then walks off.
  await page.waitForTimeout(4000);
  await sample(page, 20, (current) => {
    for (const box of current) {
      const dx = Math.max(box.x - pointer.x, 0, pointer.x - (box.x + BODY));
      const dy = Math.max(box.y - pointer.y, 0, pointer.y - (box.y + BODY));
      expect(Math.hypot(dx, dy)).toBeGreaterThanOrEqual(BODY - 7);
    }
  });
  expect(api.requestsTo('PATCH /profile')).toEqual([]);

  // Kept in this browser: a reload brings them back.
  await page.reload();
  await expect(page.locator('[data-testid="roaming-bit"]')).toHaveCount(5);
});

test('phones get at most 3 Bits', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await turnOnFive(page).catch(() => undefined);
  await expect(page.locator('[data-testid="roaming-bit"]')).toHaveCount(3);
});

test('a double click on a resting Bit sends them away for the rest of the session', async ({
  page,
}) => {
  await turnOnFive(page);
  const resting = page
    .locator('[data-testid="roaming-bit"][style*="pointer-events: auto"]')
    .first();
  await expect(resting).toBeAttached({ timeout: 30_000 });
  await resting.dblclick({ force: true });
  await expect(page.getByText('Bit đi nghỉ đến hết phiên này')).toBeVisible();
  await expect(page.getByTestId('roaming-bits')).toHaveCount(0, { timeout: 10_000 });
  await page.reload();
  await expect(page.getByTestId('bit-roam-section')).toBeVisible();
  await expect(page.getByTestId('roaming-bits')).toHaveCount(0);
  await page.goto('/settings/appearance');
  await expect(page.getByTestId('roaming-bits')).toHaveCount(0);
});

test('under reduced motion one Bit stands still in the corner', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await turnOnFive(page).catch(() => undefined);
  const bits = page.locator('[data-testid="roaming-bit"]');
  await expect(bits).toHaveCount(1);
  const before = await boxes(page);
  await page.waitForTimeout(500);
  expect(await boxes(page)).toEqual(before);
  expect(before[0].x).toBeLessThan(40);
});

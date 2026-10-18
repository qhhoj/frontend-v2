import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/api';

const BITS = '[data-testid="loading-bit"]';
const LAYER = '[data-testid="loading-bits"]';
const LOADED_ROW = 'Đường đi ngắn nhất';

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}
/** Reads the Bits on `frames` successive animation frames, so a wait is a count of rendered frames, not a sleep. */
const boxesOverFrames = (page: Page, frames: number): Promise<Box[][]> =>
  page.evaluate(
    ([selector, frameCount]) =>
      new Promise<Box[][]>((resolve) => {
        const samples: Box[][] = [];
        const read = () => {
          samples.push(
            [...document.querySelectorAll(selector)].map((element) => {
              const { x, y, width, height } = element.getBoundingClientRect();
              return { x, y, width, height };
            }),
          );
          if (samples.length >= frameCount) resolve(samples);
          else requestAnimationFrame(read);
        };
        requestAnimationFrame(read);
      }),
    [BITS, frames] as const,
  );

test.describe('loading with motion', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('the Bits never take a click: nothing sits under them and a header link still works', async ({
    page,
    api,
  }) => {
    api.hold('GET /problems');
    await page.goto('/problems');
    await expect(page.locator(BITS)).toHaveCount(5, { timeout: 5000 });
    expect(
      await page.locator(LAYER).evaluate((layer) => getComputedStyle(layer).pointerEvents),
    ).toBe('none');
    const coveredPerFrame = await page.evaluate(
      ([layerSelector, bitSelector]) =>
        new Promise<number[]>((resolve) => {
          const layer = document.querySelector(layerSelector)!;
          const covered: number[] = [];
          const read = () => {
            covered.push(
              [...layer.querySelectorAll(bitSelector)].filter((element) => {
                const { x, y, width, height } = element.getBoundingClientRect();
                const hit = document.elementFromPoint(x + width / 2, y + height / 2);
                return hit !== null && layer.contains(hit);
              }).length,
            );
            if (covered.length >= 30) resolve(covered);
            else requestAnimationFrame(read);
          };
          requestAnimationFrame(read);
        }),
      [LAYER, BITS] as const,
    );
    expect(coveredPerFrame.every((count) => count === 0)).toBe(true);
    await page.getByRole('link', { name: 'Blog' }).first().click();
    await expect(page).toHaveURL(/\/blog$/);
  });

  test('when the data arrives the layer goes at once, no Bit walking on over the content', async ({
    page,
    api,
  }) => {
    const release = api.hold('GET /problems');
    await page.goto('/problems');
    await expect(page.locator(BITS)).toHaveCount(5, { timeout: 5000 });
    release();
    await expect(page.getByText(LOADED_ROW).first()).toBeVisible();
    await expect(page.locator('[data-skeleton]')).toHaveCount(0);
    await expect(page.locator('[role="status"]')).toHaveText('');
    await expect(page.locator(BITS)).toHaveCount(0, { timeout: 1000 });
  });

  test('the swarm stops once the statement paints, though the comments below still load', async ({
    page,
    api,
  }) => {
    const releaseProblem = api.hold('GET /problems/duongdi');
    api.hold('GET /comments/pages/problem/duongdi');
    await page.goto('/problems/duongdi');
    await expect(page.locator(BITS)).toHaveCount(5, { timeout: 5000 });
    releaseProblem();
    await expect(page.locator('#main h1')).toBeVisible();
    await expect(page.locator(BITS)).toHaveCount(0, { timeout: 1000 });
  });

  /** The content box of the public header: every page column shares its edges. */
  const contentColumn = (page: Page) =>
    page.locator('[data-page-column]').evaluate((header) => {
      const box = header.getBoundingClientRect();
      const style = getComputedStyle(header);
      return {
        left: box.left + parseFloat(style.paddingLeft),
        right: box.right - parseFloat(style.paddingRight),
      };
    });

  test('the Bits keep to the gutters beside the content column on a wide screen', async ({
    page,
    api,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    api.hold('GET /problems');
    await page.goto('/problems');
    await expect(page.locator(BITS)).toHaveCount(5, { timeout: 5000 });
    const column = await contentColumn(page);
    for (const boxes of await boxesOverFrames(page, 60))
      for (const box of boxes)
        expect(box.x + box.width <= column.left || box.x >= column.right).toBe(true);
  });

  test('on a phone the Bits walk along the bottom of the viewport', async ({ page, api }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    api.hold('GET /problems');
    await page.goto('/problems');
    await expect(page.locator(BITS)).toHaveCount(3, { timeout: 5000 });
    const header = await page.locator('[data-page-column]').boundingBox();
    for (const boxes of await boxesOverFrames(page, 60))
      for (const box of boxes) {
        expect(box.y).toBeGreaterThan(844 / 2);
        expect(box.y + box.height).toBeLessThanOrEqual(844);
        expect(box.y).toBeGreaterThan(header!.y + header!.height);
      }
  });
});

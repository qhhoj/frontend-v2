import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/api';

const BITS = '[data-testid="loading-bit"]';
const LAYER = '[data-testid="loading-bits"]';
const LOADED_ROW = 'Đường đi ngắn nhất';
const THRESHOLD_MS = 600;

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}
const readBoxes = (page: Page): Promise<Box[]> =>
  page.locator(BITS).evaluateAll((elements) =>
    elements.map((element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    }),
  );

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

const pathLength = (samples: Box[][], index: number) =>
  samples
    .slice(1)
    .reduce(
      (total, boxes, step) =>
        total +
        Math.hypot(
          boxes[index].x - samples[step][index].x,
          boxes[index].y - samples[step][index].y,
        ),
      0,
    );

/** Headless Chrome never hides a tab, so the page is told it was hidden. */
const setTabHidden = (page: Page, hidden: boolean) =>
  page.evaluate((value) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => value });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);

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

  test('a hidden tab pauses the walk and coming back resumes it', async ({ page, api }) => {
    api.hold('GET /problems');
    await page.goto('/problems');
    await expect(page.locator(BITS)).toHaveCount(5, { timeout: 5000 });
    await setTabHidden(page, true);
    await boxesOverFrames(page, 2); // the loop stops on the event; let a pending frame land
    const [pausedAt, ...laterFrames] = await boxesOverFrames(page, 20);
    for (const boxes of laterFrames) expect(boxes).toEqual(pausedAt);
    await setTabHidden(page, false);
    await expect.poll(() => readBoxes(page), 'the Bits walk again').not.toEqual(pausedAt);
  });

  test('when the data arrives the Bits keep walking out of the viewport and the layer goes', async ({
    page,
    api,
  }) => {
    const release = api.hold('GET /problems');
    await page.goto('/problems');
    await expect(page.locator(BITS)).toHaveCount(5, { timeout: 5000 });
    release();
    await expect(page.getByText(LOADED_ROW).first()).toBeVisible();
    await expect(page.locator('[data-skeleton]')).toHaveCount(0);
    await expect(page.locator(LAYER)).toHaveAttribute('data-phase', 'leaving');
    const samples = await boxesOverFrames(page, 20);
    for (let index = 0; index < 5; index += 1)
      expect(pathLength(samples, index), `Bit ${index} keeps walking`).toBeGreaterThan(0);
    await expect(page.locator('[role="status"]')).toHaveText('');
    await expect(page.locator(BITS)).toHaveCount(0, { timeout: 8000 });
  });

  test('a page that loads quickly never shows a Bit', async ({ page, api }) => {
    void api; // installs the fake API
    await page.addInitScript((selector) => {
      new MutationObserver(() => {
        if (document.querySelector(selector)) Object.assign(window, { bitSeen: true });
      }).observe(document, { childList: true, subtree: true });
    }, BITS);
    // Time stands still until the test moves it, so a slow machine cannot run the wait out while the page loads.
    await page.clock.install({ time: 0 });
    await page.clock.pauseAt(1000);
    await page.goto('/problems');
    const loadedRow = page.getByText(LOADED_ROW);
    for (let step = 0; step < 200 && (await loadedRow.count()) === 0; step += 1)
      await page.clock.runFor(1);
    await expect(loadedRow.first()).toBeVisible();
    await page.clock.runFor(THRESHOLD_MS * 2); // well past the wait: a Bit that was going to appear would be here
    expect(await page.evaluate(() => 'bitSeen' in window), 'a Bit appeared meanwhile').toBe(false);
    await expect(page.locator(BITS)).toHaveCount(0);
    await expect(page.locator('[role="status"]')).toHaveText('');
  });
});

test.describe('loading with reduced motion', () => {});

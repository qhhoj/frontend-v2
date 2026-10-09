import type { Page } from '@playwright/test';
import { LARGE_REPLAY, largeReplayChunk } from '../src/test/replay-fixtures';
import { expect, test } from './fixtures/api';
import { ok } from './fixtures/reply';

/**
 * Render cost of one player step on a big board (F2 final review I3), in a real browser at 4x CPU slowdown. Each step seeks
 * one x300 tick (75 s) and times script, render and layout. Timings are reported, not asserted (they depend on the host).
 */
const TICK_SECONDS = 75;
const STEPS = 12;
const START = 5400;

/** ms from the seek to the board laid out, per step. */
const timeSteps = (page: Page) =>
  page.evaluate(
    async ({ start, step, steps }) => {
      const range = document.querySelector<HTMLInputElement>('input[type="range"]')!;
      const timings: number[] = [];
      for (let index = 1; index <= steps; index += 1) {
        const startedAt = performance.now();
        range.value = String(start + index * step);
        range.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 0));
        void document.body.offsetHeight;
        timings.push(performance.now() - startedAt);
      }
      return timings;
    },
    { start: START, step: TICK_SECONDS, steps: STEPS },
  );

/** The trace recorder snapshots the DOM on every step; it would be most of what is measured. */
test.use({ trace: 'off' });

const median = (values: number[]) =>
  [...values].sort((left, right) => left - right)[values.length >> 1];

for (const reducedMotion of ['reduce', 'no-preference'] as const)
  test(`a ${LARGE_REPLAY.rows}-row replay steps through x300 ticks (motion ${reducedMotion})`, async ({
    page,
    api,
  }, testInfo) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion });
    api.signedIn = false;
    api.routes['GET /contests/r41/replay'] = ok(largeReplayChunk());
    await page.goto(`/contests/r41/replay?t=${START}`);
    await expect(page.locator('tbody tr')).toHaveCount(LARGE_REPLAY.rows);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const timings = await timeSteps(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const line = `motion ${reducedMotion}: median ${median(timings).toFixed(1)} ms, max ${Math.max(...timings).toFixed(1)} ms`;
    testInfo.annotations.push({ type: 'replay-perf', description: line });
    console.info(`[replay-perf] ${line}`);
    await expect(page.getByLabel('Thời điểm phát lại')).toHaveValue(
      String(START + STEPS * TICK_SECONDS),
    );
    await expect(page.locator('tbody tr')).toHaveCount(LARGE_REPLAY.rows);
  });

import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import {
  leaderboardEntry,
  problemItem,
  RANKING_PROBLEM_IDS,
  rankingRow,
  ranking,
  submissionCase,
  submissionDetail,
  submissionItem,
} from '../src/test/fixtures';
import { THEMES } from '../src/theme/registry';
import { expect, list, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';

const BITS = '[data-testid="loading-bit"]';
const LAYER = '[data-testid="loading-bits"]';
const LOADED_ROW = 'Đường đi ngắn nhất';
const THRESHOLD_MS = 600;
const PULSE = 'qh-skeleton-pulse';
const WALKED_PX = 30;

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

/** Frames until every Bit has walked `distance` px in total, so the wait is the behaviour itself. Gives up after `maxFrames`. */
const walkUntilEachHasMoved = (page: Page, distance: number, maxFrames: number) =>
  page.evaluate(
    ([selector, wanted, limit]) =>
      new Promise<Box[][]>((resolve) => {
        const samples: Box[][] = [];
        const walked: number[] = [];
        const read = () => {
          const boxes = [...document.querySelectorAll(selector)].map((element) => {
            const { x, y, width, height } = element.getBoundingClientRect();
            return { x, y, width, height };
          });
          const previous = samples.at(-1);
          boxes.forEach((box, index) => {
            const before = previous?.[index];
            walked[index] =
              (walked[index] ?? 0) + (before ? Math.hypot(box.x - before.x, box.y - before.y) : 0);
          });
          samples.push(boxes);
          const done = boxes.length > 0 && boxes.every((_box, index) => walked[index] >= wanted);
          if (done || samples.length >= limit) resolve(samples);
          else requestAnimationFrame(read);
        };
        requestAnimationFrame(read);
      }),
    [BITS, distance, maxFrames] as const,
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

const skeletonPulses = (page: Page) =>
  page.evaluate(
    (name) =>
      document
        .getAnimations()
        .filter(
          (animation) => animation instanceof CSSAnimation && animation.animationName === name,
        ).length,
    PULSE,
  );

/** Headless Chrome never hides a tab, so the page is told it was hidden. */
const setTabHidden = (page: Page, hidden: boolean) =>
  page.evaluate((value) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => value });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);

test.describe('loading with motion', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('skeletons at once, Bits only after the wait, then they wander inside the viewport', async ({
    page,
    api,
  }) => {
    const release = api.hold('GET /problems');
    const startedAt = Date.now();
    await page.goto('/problems');
    await expect(page.locator('[data-skeleton]').first()).toBeVisible();
    await expect.poll(() => skeletonPulses(page), 'the skeletons pulse').toBeGreaterThan(0);
    await expect(page.locator(BITS)).toHaveCount(5, { timeout: 5000 });
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(THRESHOLD_MS);
    await expect(page.locator('[role="status"]')).toHaveText('Đang tải…');
    expect(
      await page.locator(LAYER).evaluate((layer) => getComputedStyle(layer).transitionDuration),
    ).toBe('0.3s');

    const { width, height } = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    }));
    const samples = await walkUntilEachHasMoved(page, WALKED_PX, 600);
    for (const boxes of samples)
      for (const box of boxes) {
        expect(box.x).toBeGreaterThanOrEqual(-0.5);
        expect(box.y).toBeGreaterThanOrEqual(-0.5);
        expect(box.x + box.width).toBeLessThanOrEqual(width + 0.5);
        expect(box.y + box.height).toBeLessThanOrEqual(height + 0.5);
      }
    for (let index = 0; index < 5; index += 1)
      expect(pathLength(samples, index), `Bit ${index} walked`).toBeGreaterThanOrEqual(WALKED_PX);
    release();
  });

  test('a phone gets three Bits', async ({ page, api }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    api.hold('GET /problems');
    await page.goto('/problems');
    await expect(page.locator(BITS)).toHaveCount(3, { timeout: 5000 });
  });

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

  test('when the data arrives the Bits stop where they are, blink, fade and disappear', async ({
    page,
    api,
  }) => {
    const release = api.hold('GET /problems');
    await page.goto('/problems');
    await expect(page.locator(BITS)).toHaveCount(5, { timeout: 5000 });
    release();
    await expect(page.getByText(LOADED_ROW).first()).toBeVisible();
    await expect(page.locator('[data-skeleton]')).toHaveCount(0);
    await expect(page.locator(LAYER)).toHaveAttribute('data-phase', 'stopped');
    const [stoppedAt, ...laterFrames] = await boxesOverFrames(page, 20);
    for (const boxes of laterFrames) expect(boxes).toEqual(stoppedAt);
    await expect(page.locator(BITS)).toHaveCount(0, { timeout: 5000 });
    await expect(page.locator('[role="status"]')).toHaveText('');
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

test.describe('loading with reduced motion', () => {
  test('one Bit stands still, nothing pulses, and it goes without a fade', async ({
    page,
    api,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const release = api.hold('GET /problems');
    await page.goto('/problems');
    await expect(page.locator(BITS)).toHaveCount(1, { timeout: 5000 });
    await expect(page.locator('[role="status"]')).toHaveText('Đang tải…');
    const [first, ...laterFrames] = await boxesOverFrames(page, 30);
    for (const boxes of laterFrames) expect(boxes).toEqual(first);
    const viewportHeight = page.viewportSize()!.height;
    expect(first[0].x).toBe(16);
    expect(first[0].y + first[0].height).toBe(viewportHeight - 16);
    expect(await skeletonPulses(page), 'no skeleton pulse').toBe(0);
    expect(
      await page.evaluate(
        () =>
          document.getAnimations().filter((animation) => animation instanceof CSSAnimation).length,
      ),
      'no running CSS animation at all',
    ).toBe(0);
    expect(
      await page.locator(LAYER).evaluate((layer) => getComputedStyle(layer).transitionDuration),
    ).toBe('0s');
    release();
    await expect(page.getByText(LOADED_ROW).first()).toBeVisible();
    await expect(page.locator(BITS)).toHaveCount(0, { timeout: 5000 });
  });
});

/** Parts of a screen measured while its skeleton shows and again once the data is in; a part is the span of every element its locator matches. */
interface ShiftCase {
  name: string;
  path: string;
  signedIn: boolean;
  /** The request the skeleton waits on. */
  hold: string;
  /** Data that fills the skeleton's rows exactly, so the loaded height is comparable. */
  answer?: (api: FakeApi) => void;
  parts: (page: Page, width: number) => Record<string, Locator>;
  viewports: number[];
  /** Parts whose height is not compared (a text block differs in length), only where they sit. */
  placedOnly?: string[];
  /** Parts whose distance from the first part's top is compared as well; a taller or shorter part above moves them. */
  placed?: string[];
}
const PHONE = 375;
const DESKTOP = 1280;
const PHONE_AND_DESKTOP = [PHONE, DESKTOP];
/** The home cards are measured on a phone, where each sits on its own row at its natural height. */
const HOME_VIEWPORTS = [PHONE];
const SHIFT_TOLERANCE_PX = 2;

const problems = (count: number) =>
  Array.from({ length: count }, (_row, index) =>
    problemItem({
      id: `0192a000-0000-7000-8000-0000000003${String(index).padStart(2, '0')}`,
      code: `p${index}`,
    }),
  );
const FULL_BOARD_ROWS = 10;
const SHIFT_CASES: ShiftCase[] = [
  {
    name: 'problem table card',
    path: '/problems',
    signedIn: false,
    hold: 'GET /problems',
    answer: (api) => (api.routes['GET /problems'] = list(problems(8))),
    parts: (page) => ({ card: page.locator('main .glass:has(table)') }),
    viewports: PHONE_AND_DESKTOP,
  },
  {
    name: 'rating hero card',
    path: '/',
    signedIn: true,
    hold: 'GET /users/user_01',
    // The rating delta pill wraps below the number on a phone, so the rating row is only compared where it fits.
    parts: (page, width) => ({
      ...(width === PHONE
        ? {}
        : {
            card: page.getByTestId('rating-hero'),
            'rating row': page.locator(
              '[data-skeleton-region="rating"], [data-testid="rating-row"]',
            ),
          }),
      chart: page.locator(
        '[data-skeleton-region="chart"], [data-testid="rating-hero"] svg[role="img"]',
      ),
      tiles: page.locator('[data-skeleton-region="tile"], [data-testid="rating-hero"] dl > div'),
    }),
    viewports: PHONE_AND_DESKTOP,
  },
  {
    name: 'quick submit card',
    path: '/',
    signedIn: true,
    hold: 'GET /problems/meta',
    parts: (page) => ({ card: page.getByTestId('quick-submit') }),
    viewports: HOME_VIEWPORTS,
  },
  {
    name: 'recent submissions card',
    path: '/',
    signedIn: true,
    hold: 'GET /submissions',
    answer: (api) =>
      (api.routes['GET /submissions'] = list(
        Array.from({ length: 4 }, (_row, index) => submissionItem({ id: `sub-${index}` })),
      )),
    parts: (page) => ({ card: page.getByTestId('recent-submissions') }),
    viewports: HOME_VIEWPORTS,
  },
  {
    name: 'live contest card',
    path: '/',
    signedIn: true,
    hold: 'GET /contests',
    parts: (page) => ({ card: page.getByTestId('live-contest') }),
    viewports: HOME_VIEWPORTS,
  },
  {
    name: 'top users card',
    path: '/',
    signedIn: true,
    hold: 'GET /users',
    answer: (api) =>
      (api.routes['GET /users'] = list(
        [1, 2, 3].map((rank) => leaderboardEntry(rank, `user_0${rank}`, 2800 - rank * 100)),
      )),
    parts: (page) => ({ card: page.getByTestId('top-users') }),
    viewports: HOME_VIEWPORTS,
  },
  {
    name: 'ranking board',
    path: '/contests/r42/ranking',
    signedIn: false,
    hold: 'GET /contests/r42/ranking',
    answer: (api) =>
      (api.routes['GET /contests/r42/ranking'] = {
        body: {
          data: ranking({
            frozen: false,
            rows: Array.from({ length: FULL_BOARD_ROWS }, (_row, index) =>
              rankingRow(
                index + 1,
                `part-${index}`,
                `user_${String(index).padStart(2, '0')}`,
                1,
                10,
                // A row of filled cells is the tallest and the usual one.
                Object.fromEntries(
                  RANKING_PROBLEM_IDS.map((problemId) => [
                    problemId,
                    { time: 540, points: 1, tries: 1 },
                  ]),
                ),
              ),
            ),
          }),
        },
      }),
    parts: (page) => ({
      podium: page.locator('[data-skeleton-region="podium"], main section.grid'),
      'table header': page.locator('[data-skeleton-region="table-header"], main thead tr'),
      'table rows': page.locator('[data-skeleton-region="row"], main tbody tr'),
    }),
    viewports: PHONE_AND_DESKTOP,
    placed: ['table header', 'table rows'],
  },
  {
    name: 'problem header and tab row',
    path: '/problems/duongdi',
    signedIn: false,
    hold: 'GET /problems/duongdi',
    parts: (page) => ({
      header: page.getByTestId('problem-header'),
      tabs: page.locator('[data-skeleton-region="tabs"], [role="tablist"]'),
      statement: page.getByTestId('statement-card'),
    }),
    viewports: PHONE_AND_DESKTOP,
    placed: ['tabs', 'statement'],
    placedOnly: ['statement'],
  },
  {
    name: 'problem header limits',
    path: '/problems/duongdi',
    signedIn: false,
    hold: 'GET /problems/duongdi',
    parts: (page) => ({
      card: page.getByTestId('problem-header'),
      limits: page.locator('[data-skeleton-region="limits"], [data-testid="limits"]'),
    }),
    viewports: PHONE_AND_DESKTOP,
    placed: ['limits'],
  },
  {
    name: 'submission summary and cases card',
    path: '/submissions/sub-1',
    signedIn: true,
    hold: 'GET /submissions/sub-1',
    answer: (api) =>
      (api.routes['GET /submissions/sub-1'] = {
        body: {
          data: submissionDetail({
            cases: Array.from({ length: 6 }, (_row, index) =>
              submissionCase({ position: index + 1 }),
            ),
            totalCases: 6,
          }),
        },
      }),
    parts: (page) => ({
      summary: page.getByTestId('submission-summary'),
      'cases card': page.getByTestId('cases-card'),
    }),
    viewports: PHONE_AND_DESKTOP,
    placed: ['cases card'],
  },
  {
    name: 'submission table card',
    path: '/submissions',
    signedIn: true,
    hold: 'GET /submissions',
    answer: (api) =>
      (api.routes['GET /submissions'] = list(
        Array.from({ length: 10 }, (_row, index) => submissionItem({ id: `sub-${index}` })),
      )),
    parts: (page) => ({
      'table card': page.getByTestId('submission-table-card'),
      'table rows': page.locator('[data-skeleton-region="row"], main tbody tr'),
    }),
    viewports: PHONE_AND_DESKTOP,
    placed: ['table rows'],
  },
  {
    name: 'stats strip',
    path: '/submissions',
    signedIn: true,
    hold: 'GET /submissions/stats',
    parts: (page) => ({ strip: page.getByTestId('stats-strip') }),
    viewports: PHONE_AND_DESKTOP,
  },
];

const spanOf = (locator: Locator) =>
  locator.evaluateAll((elements) => {
    const rects = elements.map((element) => element.getBoundingClientRect());
    const top = Math.min(...rects.map((rect) => rect.top));
    return { top, height: Math.max(...rects.map((rect) => rect.bottom)) - top };
  });
/** Every part's height, and for the `placed` ones the distance of their top from the first part's top. */
const layoutOf = async (
  parts: Record<string, Locator>,
  placed: string[] = [],
  placedOnly: string[] = [],
) => {
  const spans = Object.fromEntries(
    await Promise.all(
      Object.entries(parts).map(async ([part, locator]) => [part, await spanOf(locator)] as const),
    ),
  );
  const firstTop = Object.values(spans)[0].top;
  return {
    ...Object.fromEntries(
      Object.entries(spans)
        .filter(([part]) => !placedOnly.includes(part))
        .map(([part, span]) => [`${part} height`, span.height]),
    ),
    ...Object.fromEntries(placed.map((part) => [`${part} offset`, spans[part].top - firstTop])),
  };
};

for (const shift of SHIFT_CASES)
  for (const width of shift.viewports)
    test(`the ${shift.name} keeps its size when its data arrives, at ${width} px`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      api.signedIn = shift.signedIn;
      shift.answer?.(api);
      const release = api.hold(shift.hold);
      await page.goto(shift.path);
      const parts = shift.parts(page, width);
      for (const [part, locator] of Object.entries(parts))
        await expect(locator.first(), `${part} skeleton`).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const skeleton = await layoutOf(parts, shift.placed, shift.placedOnly);
      release();
      await expect(page.locator('[data-skeleton]')).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      /** Per measure the change in px once loaded; 0 stands for "within the tolerance". */
      const changes = async () =>
        Object.fromEntries(
          Object.entries(await layoutOf(parts, shift.placed, shift.placedOnly)).map(
            ([measure, value]) => {
              const change = value - skeleton[measure];
              return [measure, Math.abs(change) <= SHIFT_TOLERANCE_PX ? 0 : change];
            },
          ),
        );
      await expect
        .poll(changes, { message: 'change in px per measure, skeleton to loaded' })
        .toEqual(Object.fromEntries(Object.keys(skeleton).map((measure) => [measure, 0])));
    });

for (const theme of THEMES)
  for (const viewport of [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'phone', width: 375, height: 812 },
  ])
    test(`a loading page has no WCAG 2.1 A/AA violations in ${theme.id} on a ${viewport.name}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.emulateMedia({ colorScheme: theme.scheme });
      await page.addInitScript((id) => localStorage.setItem('qhhoj.theme', id), theme.id);
      api.hold('GET /problems');
      await page.goto('/problems');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
      await expect(page.locator(BITS)).toHaveCount(1, { timeout: 5000 });
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(
        violations.map(
          (violation) =>
            `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
        ),
      ).toEqual([]);
    });

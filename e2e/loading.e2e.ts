import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import {
  contestItem,
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
import { CONTEST_FIXTURE_NOW, expect, list, test } from './fixtures/api';
import { closeStream, installControlledEventSource } from './fixtures/controlled-event-source';
import {
  defineShiftTests,
  DESKTOP,
  PHONE,
  PHONE_AND_DESKTOP,
  type ShiftCase,
} from './fixtures/layout-shift';

/** Same as RANKING_POLL_MS in src/features/contests/contests.queries.ts. */
const RANKING_POLL_MS = 30_000;

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

/** Widths where the verdict card's Bit could wrap to its own row. (The facts card wraps its labels at 320 px; that is not measured here.) */
const NARROW_PHONE = 320;
const LAPTOP = 1024;
/** The home cards are measured on a phone, where each sits on its own row at its natural height. */
const HOME_VIEWPORTS = [PHONE];

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
    // The rank-up Bit's reserved box is the same 32 px square as the loaded Bit (the rating row itself wraps on a phone, so only the box is compared).
    name: 'rating-up Bit',
    path: '/',
    signedIn: true,
    hold: 'GET /users/user_01',
    parts: (page) => ({
      'rank-up Bit': page.locator('[data-skeleton-region="rank-up"], [data-testid="rank-up-bit"]'),
    }),
    viewports: PHONE_AND_DESKTOP,
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
  ...(
    [
      ['recent submissions card', 'recent-submissions', 'GET /submissions'],
      ['live contest card', 'live-contest', 'GET /contests'],
      ['top users card', 'top-users', 'GET /users'],
    ] as const
  ).map(([name, testId, route]): ShiftCase => ({
    name: `${name} when it has nothing to list`,
    path: '/',
    signedIn: true,
    hold: route,
    answer: (api) => (api.routes[route] = list([])),
    parts: (page) => ({ card: page.getByTestId(testId) }),
    viewports: PHONE_AND_DESKTOP,
  })),
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
    name: 'running contest cards',
    path: '/contests',
    signedIn: false,
    hold: 'GET /contests',
    answer: (api) =>
      (api.routes['GET /contests'] = list([
        contestItem(),
        contestItem({ key: 'r44', name: 'QHH Round #44' }),
      ])),
    parts: (page) => ({
      card: page.locator('[data-skeleton-region="running-card"], [data-testid="running-contest"]'),
    }),
    placedOnly: ['card'],
    viewports: PHONE_AND_DESKTOP,
    clockAt: CONTEST_FIXTURE_NOW,
  },
  {
    name: 'contest header card',
    path: '/contests/r42',
    signedIn: true,
    hold: 'GET /contests/r42',
    clockAt: CONTEST_FIXTURE_NOW,
    parts: (page) => ({
      header: page.locator(
        '[data-skeleton-region="contest-header"], [data-testid="contest-header"]',
      ),
    }),
    viewports: PHONE_AND_DESKTOP,
  },
  {
    name: 'contest stats tiles',
    path: '/contests/r42/stats',
    signedIn: false,
    hold: 'GET /contests/r42/stats',
    clockAt: CONTEST_FIXTURE_NOW,
    parts: (page) => ({
      tile: page.locator('[data-skeleton-region="stats-tile"], [data-testid="stats-tiles"] > div'),
    }),
    viewports: PHONE_AND_DESKTOP,
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
    name: 'problem rail limits',
    path: '/problems/duongdi',
    signedIn: false,
    hold: 'GET /problems/duongdi',
    parts: (page) => ({
      card: page.getByTestId('problem-rail'),
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
    // The source sits above the cases card and its height is the source's length, so only sizes are compared.
    placed: [],
  },
  {
    name: 'submission verdict card with its Bit',
    path: '/submissions/sub-1',
    signedIn: true,
    hold: 'GET /submissions/sub-1',
    parts: (page) => ({
      card: page.locator('[data-testid="submission-summary"] > div:first-child'),
    }),
    viewports: [NARROW_PHONE, PHONE, LAPTOP, DESKTOP],
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

defineShiftTests(SHIFT_CASES);

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

/**
 * Notices that appear after the page has loaded (a stream gone, a refresh that failed). They sit above the content they
 * push down, so the check is: the heading above does not move, and what sits below moves by exactly the notice's own box
 * plus its margin and any flex gap, nothing more.
 */
const NOTICE_SHIFT_TOLERANCE_PX = 2;
const topOf = (locator: Locator) =>
  locator.evaluate((element) => element.getBoundingClientRect().top);
const noticeFootprint = (notice: Locator) =>
  notice.evaluate((element) => {
    const parent = element.parentElement!;
    const gap = getComputedStyle(parent).display.includes('flex')
      ? parseFloat(getComputedStyle(parent).rowGap) || 0
      : 0;
    return (
      element.getBoundingClientRect().height +
      parseFloat(getComputedStyle(element).marginBottom) +
      gap
    );
  });

const expectNoticeMovesOnlyWhatIsBelow = async (
  trigger: () => Promise<void>,
  notice: Locator,
  above: Locator,
  below: Locator,
) => {
  const aboveBefore = await topOf(above);
  const belowBefore = await topOf(below);
  await trigger();
  await expect(notice).toBeVisible();
  expect(
    Math.abs((await topOf(above)) - aboveBefore),
    'the heading above stays put',
  ).toBeLessThanOrEqual(NOTICE_SHIFT_TOLERANCE_PX);
  const shift = (await topOf(below)) - belowBefore;
  expect(
    Math.abs(shift - (await noticeFootprint(notice))),
    'only the notice moves what is below',
  ).toBeLessThanOrEqual(NOTICE_SHIFT_TOLERANCE_PX);
};

for (const width of [PHONE, DESKTOP]) {
  test(`the live paused notice pushes the list down by its own box only, at ${width} px`, async ({
    page,
    api,
  }) => {
    await installControlledEventSource(page);
    await page.setViewportSize({ width, height: 900 });
    api.routes['GET /submissions'] = list([submissionItem({ id: 'sub-1' })]);
    await page.goto('/submissions');
    await expect(page.locator('tbody tr').first()).toBeVisible();
    await expectNoticeMovesOnlyWhatIsBelow(
      () => closeStream(page),
      page.getByTestId('live-paused'),
      page.getByRole('heading', { level: 1 }),
      page.locator('tbody tr').first(),
    );
  });

  test(`the stale reload notice pushes the verdict down by its own box only, at ${width} px`, async ({
    page,
    api,
  }) => {
    await installControlledEventSource(page);
    await page.setViewportSize({ width, height: 900 });
    api.signedIn = true;
    api.routes['GET /submissions/:id'] = () => ({
      body: { data: submissionDetail({ status: 'G', result: null, points: null }) },
    });
    await page.goto('/submissions/sub-1');
    await expect(page.getByTestId('grading-line')).toBeVisible();
    await expectNoticeMovesOnlyWhatIsBelow(
      () => closeStream(page),
      page.getByTestId('stale-reload'),
      page.getByRole('heading', { level: 1 }),
      page.locator('.rounded-panel').filter({ has: page.getByTestId('score') }),
    );
  });

  test(`the ranking refresh notice pushes the board down by its own box only, at ${width} px`, async ({
    page,
    api,
  }) => {
    await page.clock.install();
    await page.setViewportSize({ width, height: 900 });
    let failing = false;
    api.routes['GET /contests/r42/ranking'] = () =>
      failing
        ? { status: 500, body: { error: { code: 'internal', message: 'x' } } }
        : { body: { data: ranking() } };
    await page.goto('/contests/r42/ranking');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoticeMovesOnlyWhatIsBelow(
      async () => {
        failing = true;
        await page.clock.fastForward(RANKING_POLL_MS + 1000);
      },
      page.getByText('Không cập nhật được bảng, đang thử lại.'),
      page.getByRole('heading', { level: 1 }),
      page.locator('main tbody tr').first(),
    );
  });
}

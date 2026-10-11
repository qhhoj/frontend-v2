import type { Page } from '@playwright/test';
import { submissionItem } from '../src/test/fixtures';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { list } from './fixtures/api';
import { ROW } from './fixtures/submission-rows';

const PHONE_WIDTH = 375;
const DESKTOP_WIDTH = 1280;
/** The settle window (3 s) plus a margin. */
const SETTLE_TIMEOUT_MS = 6000;
/** Set to a folder to save screenshots of the live states there. */
/** Enough rows that the page scrolls well past the pill. */
const LONG_PAGE_ROWS = 40;
const SHOTS_DIR = process.env.LIVE_SHOTS_DIR;

/** A browser EventSource that never connects: the test pushes frames through `window.pushEvent`. */
const installControlledEventSource = (page: Page) =>
  page.addInitScript(() => {
    const streams: Array<{ listeners: Map<string, Array<(event: MessageEvent) => void>> }> = [];
    class ControlledEventSource {
      readonly listeners = new Map<string, Array<(event: MessageEvent) => void>>();
      readyState = 1;
      constructor() {
        streams.push(this);
      }
      addEventListener(type: string, listener: (event: MessageEvent) => void) {
        this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
      }
      close() {
        this.readyState = 2;
      }
    }
    Object.assign(window, {
      EventSource: ControlledEventSource,
      pushEvent: (type: string, data: unknown) =>
        streams
          .at(-1)
          ?.listeners.get(type)
          ?.forEach((listener) => listener(new MessageEvent(type, { data: JSON.stringify(data) }))),
    });
  });
const pushQueued = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { pushEvent: (type: string, data: unknown) => void }).pushEvent(
      'queued',
      { submissionId: 'new', userId: 'u', problemId: 'p', type: 'queued', status: 'QU' },
    ),
  );
const newRow = () => submissionItem({ id: 'new', status: 'QU', result: null, points: null });
/** Page 2 of a long list, and a page-1 probe that reports rows beyond it. */
const routePageTwoWithNewRows = (api: FakeApi) => {
  api.routes['GET /submissions'] = ({ url }) =>
    url.searchParams.get('pageSize') === '1'
      ? { body: { data: [newRow()], meta: { page: 1, pageSize: 1, total: 103 } } }
      : {
          body: {
            data: [...Array(LONG_PAGE_ROWS).keys()].map((index) =>
              submissionItem({ id: `p2-${index}` }),
            ),
            meta: { page: 2, pageSize: 50, total: 100 },
          },
        };
};

for (const width of [DESKTOP_WIDTH, PHONE_WIDTH])
  for (const scheme of ['light', 'dark'] as const)
    test.describe(`live submission list at ${width} px, ${scheme}`, () => {
      test.beforeEach(async ({ page }) => {
        await installControlledEventSource(page);
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme: scheme });
      });

      test('brings the top of the list into view when the pill is clicked', async ({
        page,
        api,
      }) => {
        routePageTwoWithNewRows(api);
        await page.goto('/submissions?page=2');
        await expect(page.locator(ROW)).toHaveCount(LONG_PAGE_ROWS);
        await pushQueued(page);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.getByTestId('new-pill').click({ timeout: SETTLE_TIMEOUT_MS });
        await expect(page).not.toHaveURL(/page=2/);
        const firstRow = page.locator(ROW).first();
        await expect(firstRow).toBeInViewport();
        expect((await firstRow.boundingBox())!.y).toBeGreaterThanOrEqual(0);
      });

      test('prepends a new row on page 1 and marks it', async ({ page, api }) => {
        let calls = 0;
        api.routes['GET /submissions'] = () =>
          list(calls++ === 0 ? [submissionItem()] : [newRow(), submissionItem()]);
        await page.goto('/submissions');
        await expect(page.locator(ROW)).toHaveCount(1);
        if (SHOTS_DIR)
          await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'no-preference' });
        await pushQueued(page);
        await expect(page.locator(ROW).first()).toHaveAttribute('data-id', 'new', {
          timeout: SETTLE_TIMEOUT_MS,
        });
        await expect(page.locator(ROW).first()).toHaveClass(/row-added/);
        if (SHOTS_DIR)
          await page.screenshot({ path: `${SHOTS_DIR}/task-8b-row-${width}-${scheme}.png` });
      });
    });

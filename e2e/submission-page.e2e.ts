import type { Page } from '@playwright/test';
import { submissionCase, submissionDetail } from '../src/test/fixtures';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';

const PHONE_WIDTH = 375;
const DESKTOP_WIDTH = 1280;
const MIN_TOUCH_TARGET_PX = 44;
const grading = () =>
  submissionDetail({
    status: 'G',
    result: null,
    points: null,
    casePoints: 7,
    caseTotal: 20,
    currentTestcase: 3,
  });

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

async function openSubmission(page: Page, api: FakeApi, width: number) {
  api.signedIn = true;
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/submissions/sub-1');
  await expect(page.getByTestId('score')).toBeVisible();
}

for (const width of [PHONE_WIDTH, DESKTOP_WIDTH])
  test.describe(`submission page at ${width} px`, () => {
    test('never scrolls the page sideways and keeps its actions touchable', async ({
      page,
      api,
    }) => {
      api.routes['GET /submissions/sub-1/source'] = {
        body: { data: { id: 'sub-1', source: `${'x'.repeat(400)}\nshort\n` } },
      };
      await openSubmission(page, api, width);
      await expect(page.getByRole('region', { name: 'Mã nguồn' })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      const resubmit = (await page.getByRole('link', { name: 'Nộp lại' }).boundingBox())!;
      expect(resubmit.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
    });

    test('follows the grading live and ends on the final verdict', async ({ page, api }) => {
      await installControlledEventSource(page);
      let finished = false;
      api.routes['GET /submissions/sub-1'] = () => ({
        body: {
          data: finished
            ? submissionDetail({ status: 'D', result: 'AC', points: 1600 })
            : { ...grading(), cases: [...grading().cases!, submissionCase({ position: 4 })] },
        },
      });
      await openSubmission(page, api, width);
      await expect(page.getByTestId('grading-line')).toBeVisible();
      await expect(page.getByTestId('score')).toHaveText('560');
      await expect(page.getByTestId('pending-row')).toHaveCount(16);
      finished = true;
      await page.evaluate(() =>
        (window as unknown as { pushEvent: (type: string, data: unknown) => void }).pushEvent(
          'done',
          {
            submissionId: 'sub-1',
            type: 'done',
            status: 'D',
            currentTestcase: 0,
          },
        ),
      );
      await expect(page.getByTestId('score')).toContainText('1600');
      await expect(page.getByTestId('grading-line')).toHaveCount(0);
      await expect(page.getByTestId('pending-row')).toHaveCount(0);
    });
  });

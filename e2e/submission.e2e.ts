import type { Page } from '@playwright/test';
import { PY3_ID, submissionDetail, submissionItem } from '../src/test/fixtures';
import { expect, list, streamFrame, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { ROW } from './fixtures/submission-rows';

const PHONE_WIDTH = 375;
/** The settle window of the live list (3 s) plus a margin. */
const SETTLE_TIMEOUT_MS = 6000;
const GRADING_ROW = {
  status: 'G' as const,
  result: null,
  points: null,
  casePoints: 7,
  caseTotal: 20,
  currentTestcase: 3,
};

test.beforeEach(({ api }) => {
  api.signedIn = true;
});

test.describe('submission page', () => {
  test('follows the grading over the stream and ends on the final verdict', async ({
    page,
    api,
  }) => {
    let streamOpened = false;
    api.routes['GET /events/submissions/:id'] = () => {
      streamOpened = true;
      return {
        contentType: 'text/event-stream',
        raw: `retry: 600000\n\n${streamFrame('state', { status: 'G', currentTestcase: 3 })}${streamFrame('done', { submissionId: 'sub-1', type: 'done', status: 'D', currentTestcase: 0 })}`,
      };
    };
    api.routes['GET /submissions/sub-1'] = () => ({
      body: {
        data: streamOpened
          ? submissionDetail({ status: 'D', result: 'AC', points: 1600 })
          : submissionDetail(GRADING_ROW),
      },
    });
    await page.goto('/submissions/sub-1');
    await expect(page.getByTestId('score')).toContainText('1600');
    await expect(page.getByTestId('grading-line')).toHaveCount(0);
    await expect(page.getByTestId('pending-row')).toHaveCount(0);
    await expect(page.getByTestId('stale-reload')).toHaveCount(0);
    await expect(page.getByRole('img', { name: 'Chấp nhận' })).toBeVisible();
    await expect(page.getByTestId('case-row')).not.toHaveCount(0);
  });

  test('says the connection stopped when the stream is refused and the row never ends', async ({
    page,
    api,
  }) => {
    api.routes['GET /events/submissions/:id'] = {
      status: 404,
      body: { error: { code: 'not_found', message: 'x' } },
    };
    api.routes['GET /submissions/sub-1'] = { body: { data: submissionDetail(GRADING_ROW) } };
    await page.goto('/submissions/sub-1');
    await expect(page.getByTestId('stale-reload')).toContainText(
      'Kết nối đã dừng; tải lại để xem trạng thái mới nhất',
    );
    await expect(
      page.getByTestId('stale-reload').getByRole('button', { name: 'Tải lại' }),
    ).toBeVisible();
  });

  test('a hidden source keeps the summary and explains itself', async ({ page, api }) => {
    api.routes['GET /submissions/sub-1/source'] = {
      status: 403,
      body: { error: { code: 'hidden', message: 'x' } },
    };
    await page.goto('/submissions/sub-1');
    await expect(page.getByTestId('score')).toBeVisible();
    await expect(page.getByText('Bạn không có quyền xem bài nộp này')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Nộp lại' })).toHaveCount(0);
  });
});

const rows = (page: Page) => page.locator(ROW);
async function openList(page: Page, api: FakeApi, path = '/submissions') {
  api.routes['GET /submissions'] = ({ url }) => {
    const wantedResults = url.searchParams.getAll('result');
    const all = [
      submissionItem({ id: 'ac-1', result: 'AC' }),
      submissionItem({ id: 'wa-1', result: 'WA' }),
    ];
    return list(
      wantedResults.length ? all.filter((row) => wantedResults.includes(row.result!)) : all,
    );
  };
  await page.goto(path);
  await expect(rows(page).first()).toBeVisible();
}

test.describe('submission list', () => {
  test('keeps its filters in the URL across reload and back and forward', async ({ page, api }) => {
    await openList(page, api);
    await page.getByTestId('advanced-filters').click();
    const panel = page.getByRole('region', { name: 'Bộ lọc nâng cao' });
    await panel.getByRole('checkbox', { name: /WA/ }).check();
    await expect(page).toHaveURL(/result=WA/);
    await expect(rows(page)).toHaveCount(1);
    await panel.getByLabel('Bài', { exact: true }).fill('duongdi');
    await panel.getByLabel('Người nộp', { exact: true }).fill('user_01');
    await expect(page).toHaveURL(/problem=duongdi/);
    await expect(page).toHaveURL(/user=user_01/);
    const language = page.getByRole('search').getByRole('combobox', { name: /Ngôn ngữ/ });
    await language.selectOption({ label: 'Python 3' });
    await expect(page).toHaveURL(new RegExp(`language=${PY3_ID}`));

    // The filters only the panel shows open it again after a reload.
    await page.reload();
    await expect(panel.getByRole('checkbox', { name: /WA/ })).toBeChecked();
    await expect(panel.getByLabel('Bài', { exact: true })).toHaveValue('duongdi');
    await expect(panel.getByLabel('Người nộp', { exact: true })).toHaveValue('user_01');
    await expect(language).toHaveValue(PY3_ID);

    await page.goBack();
    await expect(page).not.toHaveURL(new RegExp(`language=${PY3_ID}`));
    await page.goForward();
    await expect(page).toHaveURL(new RegExp(`language=${PY3_ID}`));
  });

  test('switching live updates off puts live=0 in the URL and opens no feed', async ({
    page,
    api,
  }) => {
    await openList(page, api);
    await expect.poll(() => api.requestsTo('GET /events/submissions').length).toBe(1);
    await page.getByTestId('live-toggle').click();
    await expect(page).toHaveURL(/live=0/);
    api.requests.length = 0;
    await page.reload();
    await expect(rows(page).first()).toBeVisible();
    await expect(page.getByTestId('live-toggle')).toHaveAttribute('aria-pressed', 'false');
    expect(api.requestsTo('GET /events/submissions')).toEqual([]);
  });

  test('a queued frame on page 1 adds the row and announces the count once', async ({
    page,
    api,
  }) => {
    let listCalls = 0;
    api.routes['GET /submissions'] = () =>
      list(
        listCalls++ === 0
          ? [submissionItem()]
          : [
              submissionItem({ id: 'new', status: 'QU', result: null, points: null }),
              submissionItem(),
            ],
      );
    api.routes['GET /events/submissions'] = {
      contentType: 'text/event-stream',
      raw: `retry: 600000\n\n${streamFrame('queued', { submissionId: 'new', userId: 'u', problemId: 'p', type: 'queued', status: 'QU' })}`,
    };
    await page.goto('/submissions');
    await expect(rows(page).first()).toHaveAttribute('data-id', 'new', {
      timeout: SETTLE_TIMEOUT_MS,
    });
    await expect(page.getByRole('status').filter({ hasText: 'Có 1 bài nộp mới' })).toHaveCount(1);
  });

  test.describe('at 375 px', () => {
    test.use({ viewport: { width: PHONE_WIDTH, height: 812 } });

    test('puts the filters above the list, whose rows stack inside the card without scrolling the page', async ({
      page,
      api,
    }) => {
      await openList(page, api);
      const rail = (await page.getByRole('search').boundingBox())!;
      const card = (await page.getByTestId('submission-table-card').boundingBox())!;
      expect(rail.y + rail.height).toBeLessThanOrEqual(card.y);
      await expect(page.getByTestId('submission-table-card').locator('table')).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
      ).toBeLessThanOrEqual(0);
    });
  });
});

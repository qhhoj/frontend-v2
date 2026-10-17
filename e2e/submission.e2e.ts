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

  test('a hidden source keeps the result and explains itself', async ({ page, api }) => {
    const stranger = { id: 'someone-else', username: 'user_07', rating: null };
    api.routes['GET /submissions/sub-1'] = {
      body: { data: submissionDetail({ sourceAccess: 'hidden', user: stranger }) },
    };
    await page.goto('/submissions/sub-1');
    await expect(page.getByTestId('score')).toBeVisible();
    await expect(page.getByText('Bạn không xem được mã nguồn của bài nộp này.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Nộp lại' })).toHaveCount(0);
  });

  test('a visitor opens the result; the source asks to sign in and comes back here', async ({
    page,
    api,
  }) => {
    api.signedIn = false;
    api.routes['GET /submissions/sub-1'] = {
      body: { data: submissionDetail({ sourceAccess: 'sign_in' }) },
    };
    await page.goto('/submissions/sub-1');
    await expect(page.getByTestId('score')).toBeVisible();
    await expect(page.getByTestId('case-row')).not.toHaveCount(0);
    await page.getByTestId('source-locked').getByRole('link', { name: 'Đăng nhập' }).click();
    await expect(page).toHaveURL(/\/login\?redirect=\/submissions\/sub-1$/);
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

  test('re-reads the page while a row with a test strip is judged, and stops once it is done', async ({
    page,
    api,
  }) => {
    api.signedIn = true;
    const strip = (statuses: ('AC' | 'WA')[]) => ({
      unit: 'case' as const,
      statuses,
      batches: statuses.map(() => null),
      more: 0,
      total: 3,
    });
    const states = [
      submissionItem({ status: 'G', result: null, points: null, testSummary: strip(['AC']) }),
      submissionItem({ status: 'G', result: null, points: null, testSummary: strip(['AC', 'AC']) }),
      submissionItem({ testSummary: strip(['AC', 'AC', 'WA']), result: 'WA', points: 0 }),
    ];
    let reads = 0;
    api.routes['GET /submissions'] = () => list([states[Math.min(reads++, states.length - 1)]]);
    await page.goto('/submissions');
    await expect(page.getByTestId('test-strip')).toContainText('1/3 test đúng');
    await expect(page.getByTestId('test-strip')).toContainText('2/3 test đúng', { timeout: 5_000 });
    await expect(page.getByTestId('test-strip')).toContainText('2/3 test đúng · 1 WA', {
      timeout: 5_000,
    });
    const settled = reads;
    await page.waitForTimeout(4_000);
    expect(reads).toBe(settled);
  });

  test.describe('at 375 px', () => {
    test.use({ viewport: { width: PHONE_WIDTH, height: 812 } });

    test('puts the filters above the cards, which fit the width without scrolling the page', async ({
      page,
      api,
    }) => {
      await openList(page, api);
      const rail = (await page.getByRole('search').boundingBox())!;
      const cards = (await page.getByTestId('submission-card-list').boundingBox())!;
      expect(rail.y + rail.height).toBeLessThanOrEqual(cards.y);
      await expect(page.locator('table')).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
      ).toBeLessThanOrEqual(0);
    });
  });
});

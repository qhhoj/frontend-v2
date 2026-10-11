import {
  contestDetail,
  contestItem,
  contestProblem,
  announcement,
  ranking,
  rankingRow,
  RANKING_PROBLEM_IDS,
} from '../src/test/fixtures';
import { expectNoAxeViolations } from './fixtures/audit';
import { CONTEST_FIXTURE_NOW, expect, streamFrame, test } from './fixtures/api';

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(CONTEST_FIXTURE_NOW);
});

const detailWith = (overrides: Parameters<typeof contestDetail>[0]) => ({
  body: {
    data: contestDetail({
      problems: [contestProblem(0), contestProblem(1), contestProblem(2)],
      ...overrides,
    }),
  },
});

test('the list groups contests by phase and leads to a contest', async ({ page, api }) => {
  void api; // installs the fake API
  await page.goto('/contests');
  const main = page.locator('#main');
  await expect(main.getByRole('heading', { level: 2, name: /Đang diễn ra/ })).toBeVisible();
  await expect(main.getByRole('heading', { level: 2, name: /Sắp diễn ra/ })).toBeVisible();
  await expect(main.getByRole('heading', { level: 2, name: /Đã kết thúc/ })).toBeVisible();
  await main.getByRole('link', { name: /^Vào thi\b.*QHH Round #42/ }).click();
  await expect(page).toHaveURL(/\/contests\/r42$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'QHH Round #42 (Div. 2)' }),
  ).toBeVisible();
});

test('the rated filter and the single group live in the URL', async ({ page, api }) => {
  void api; // installs the fake API
  await page.goto('/contests');
  await page.getByRole('combobox', { name: 'Rating' }).selectOption('rated');
  await expect(page).toHaveURL(/rated=1/);
  await page
    .locator('#main')
    .getByRole('link', { name: /Xem riêng nhóm này/ })
    .first()
    .click();
  await expect(page).toHaveURL(/phase=running/);
  await expect(page.locator('#main h2')).toHaveCount(1);
});

test('an announcement pushed over the stream shows up and is counted', async ({ page, api }) => {
  api.routes['GET /contests/:key/announcements'] = {
    body: {
      data: [announcement(2, { title: 'Làm rõ đề bài C' })],
      meta: { page: 1, pageSize: 20, total: 1 },
    },
  };
  api.routes['GET /events/contests/:key'] = {
    contentType: 'text/event-stream',
    raw: `retry: 600000\n\n${streamFrame('announcement', { contestId: 'c', announcementId: announcement(2).id })}`,
  };
  await page.goto('/contests/r42');
  await expect(page.locator('aside').getByText('Làm rõ đề bài C')).toBeVisible();
  await expect(page.getByRole('link', { name: /Thông báo.*1 chưa đọc/ })).toBeVisible();
  await page.getByRole('link', { name: /Thông báo/ }).click();
  await expect(page.getByRole('link', { name: /Thông báo/ })).not.toContainText('chưa đọc');
});

test('a points board shows points and time inside the chip and stars only timed first solves', async ({
  page,
  api,
}) => {
  const [problemA] = RANKING_PROBLEM_IDS;
  api.routes['GET /contests/r42'] = detailWith({ formatName: 'default' });
  api.routes['GET /contests/r42/ranking'] = {
    body: {
      data: ranking({
        frozen: false,
        problems: [
          {
            problemId: problemA,
            code: 'r42a',
            label: 'A',
            points: 100,
            firstSolve: 'part-07',
            acceptedCount: 1,
          },
        ],
        rows: [
          rankingRow(1, 'part-07', 'user_07', 100, 492, { [problemA]: { points: 100, time: 492 } }),
          rankingRow(2, 'part-12', 'user_12', 100, 600, { [problemA]: { points: 100, time: 600 } }),
        ],
      }),
    },
  };
  await page.goto('/contests/r42/ranking');
  const row = page.getByRole('row').filter({ hasText: 'user_07' });
  await expect(row.getByTestId('cell-time')).toHaveText('0:08:12');
  await expect(row.getByText('Giải đầu tiên: 100 điểm, lúc 0:08:12')).toBeAttached();
  // A solve that is not the first one carries no first-solve note and no star.
  const laterRow = page.getByRole('row').filter({ hasText: 'user_12' });
  await expect(laterRow.getByTestId('cell-time')).toHaveText('0:10:00');
  await expect(laterRow.getByText('Giải đầu tiên')).toHaveCount(0);
  await expect(page.getByRole('columnheader', { name: 'Điểm · giờ' })).toBeVisible();
});

test('the signed-in list shows the current contest with a way back', async ({ page, api }) => {
  api.signedIn = true;
  api.routes['GET /contests'] = ({ url }) =>
    url.searchParams.get('phase') === 'running'
      ? {
          body: {
            data: [contestItem({ viewer: { liveStatus: 'participating', isCurrent: true } })],
            meta: { page: 1, pageSize: 100, total: 1 },
          },
        }
      : { body: { data: [], meta: { page: 1, pageSize: 5, total: 0 } } };
  await page.goto('/contests');
  await expect(page.getByText('Bạn đang thi')).toBeVisible();
  // Chromium puts a space before the sr-only colon, so the name is "Quay lại kỳ thi : QHH Round #42 (Div. 2)".
  await expect(
    page.getByRole('link', { name: /^Quay lại kỳ thi\s?: QHH Round #42 \(Div\. 2\)$/ }),
  ).toBeVisible();
  await expectNoAxeViolations(page);
});

test('a refused join shows its own text beside Bit', async ({ page, api }) => {
  api.signedIn = true;
  api.routes['POST /contests/:key/join'] = {
    status: 409,
    body: { error: { code: 'contest_not_started', message: 'x' } },
  };
  await page.goto('/contests/r42');
  await page.getByRole('button', { name: 'Vào thi' }).click();
  await expect(page.getByRole('alert').filter({ hasText: /\S/ })).toHaveText(
    'Kỳ thi chưa bắt đầu. Hãy quay lại khi kỳ thi mở.',
  );
  await expectNoAxeViolations(page);
});

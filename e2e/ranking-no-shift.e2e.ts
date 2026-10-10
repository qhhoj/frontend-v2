import type { Locator, Page } from '@playwright/test';
import {
  RANKING_PROBLEM_IDS,
  contestItem,
  leaderboardEntry,
  problemItem,
  ranking,
  rankingRow,
  submissionItem,
} from '../src/test/fixtures';
import { expect, test } from './fixtures/api';
import { list } from './fixtures/reply';

/** Chromium headless hides scrollbars; without this flag a classic (layout-taking) scrollbar never appears and the page-level jump cannot be seen. */
test.use({
  viewport: { width: 1440, height: 800 },
  launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] },
});

const TOLERANCE_PX = 1;
const USERNAMES = ['user_07', 'x', 'a_much_longer_username_for_the_name_column', 'user_03'];
const [PROBLEM_A, PROBLEM_B, PROBLEM_C] = RANKING_PROBLEM_IDS;
const cellOf = (index: number) => ({ time: 600 + index, points: 1, tries: 1 });
/** Enough rows that the ranking tab scrolls, with names of very different length so an auto-sized name column moves when rows come and go. */
const longBoard = () =>
  ranking({
    rows: Array.from({ length: 40 }, (_row, index) =>
      rankingRow(
        index + 1,
        `part-${index}`,
        index < 4 ? USERNAMES[index] : `user_${index}`,
        3,
        40 + index,
        { [PROBLEM_A]: cellOf(index), [PROBLEM_B]: cellOf(index), [PROBLEM_C]: cellOf(index) },
      ),
    ),
  });

const lefts = (locator: Locator) =>
  locator.evaluateAll((elements) => elements.map((el) => el.getBoundingClientRect().left));
/** Left edge of the page's content box and of every ranking header cell, in px. */
const snapshot = async (page: Page) => ({
  content: (await lefts(page.locator('#main nav[aria-label] a').first()))[0],
  headers: await lefts(page.locator('thead th')),
});
const scrollbarWidth = (page: Page) =>
  page.evaluate(() => window.innerWidth - document.documentElement.clientWidth);

test('ranking columns and page content keep their x across tab switches and data changes', async ({
  page,
  api,
}) => {
  api.routes['GET /contests/r42/ranking'] = { body: { data: longBoard() } };
  api.routes['GET /contests/:key/submissions'] = list([]);
  const release = api.hold('GET /contests/r42/ranking');
  const log: Record<string, unknown>[] = [];
  const tabLink = (suffix: string) => page.locator(`nav[aria-label] a[href$="${suffix}"]`).first();

  await page.goto('/contests/r42');
  await expect(tabLink('/ranking')).toBeVisible();
  const problems = (await snapshot(page)).content;
  log.push({ step: 'problems tab', content: problems, scrollbar: await scrollbarWidth(page) });

  await tabLink('/ranking').click();
  await expect(page).toHaveURL(/\/ranking/);
  await expect(tabLink('/ranking')).toBeVisible();
  const skeleton = (await snapshot(page)).content;
  log.push({ step: 'ranking skeleton', content: skeleton, scrollbar: await scrollbarWidth(page) });
  release();
  await expect(page.locator('thead th').first()).toBeVisible();
  const loaded = await snapshot(page);
  log.push({ step: 'ranking loaded', ...loaded, scrollbar: await scrollbarWidth(page) });
  await page.waitForTimeout(1000);
  const settled = await snapshot(page);
  log.push({ step: 'ranking +1s', ...settled });

  await tabLink('/submissions').click();
  await expect(page).toHaveURL(/\/submissions/);
  await expect(tabLink('/ranking')).toBeVisible();
  const submissions = await snapshot(page);
  log.push({
    step: 'submissions tab',
    content: submissions.content,
    scrollbar: await scrollbarWidth(page),
  });

  await tabLink('/ranking').click();
  await expect(page.locator('thead th').first()).toBeVisible();
  const back = await snapshot(page);
  log.push({ step: 'ranking again', ...back });

  await page.getByRole('searchbox').fill('user_07');
  await expect(page.getByRole('row')).toHaveCount(2);
  const filtered = await snapshot(page);
  log.push({ step: 'ranking filtered', ...filtered });
  console.log(JSON.stringify(log, null, 1));

  const contents = [
    problems,
    skeleton,
    loaded.content,
    settled.content,
    submissions.content,
    back.content,
  ];
  for (const content of contents)
    expect(Math.abs(content - problems)).toBeLessThanOrEqual(TOLERANCE_PX);
  for (const other of [settled, back, filtered])
    other.headers.forEach((left, index) =>
      expect(Math.abs(left - loaded.headers[index]), `header ${index}`).toBeLessThanOrEqual(
        TOLERANCE_PX,
      ),
    );
});

/** Goes to another URL inside the app, as a link would (no reload), so the page keeps its scrollbar state. */
const goInApp = (page: Page, url: string) =>
  page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
  }, url);

const LONG_NAME = 'Một cái tên rất dài để ép cột tên phải rộng ra ngoài mức bình thường của nó';
const headerLefts = (page: Page) => lefts(page.locator('#main thead th:visible'));

/** Table classes: columns must not move when the rows (and so the widest content) change. */
const TABLE_CASES = [
  {
    name: 'leaderboard',
    first: '/users',
    second: '/users?sort=points',
    setUp: (api: { routes: Record<string, unknown> }) => {
      api.routes['GET /users'] = ({ url }: { url: URL }) =>
        list(
          url.searchParams.get('sort') === 'points'
            ? [
                {
                  ...leaderboardEntry(1, 'x', 3000),
                  displayName: LONG_NAME,
                  points: 123456789,
                  organization: { id: 'o', shortName: LONG_NAME, name: LONG_NAME },
                },
              ]
            : [leaderboardEntry(1, 'user_07', 2788)],
        );
    },
  },
  {
    name: 'problem list',
    first: '/problems',
    second: '/problems?typeIds=other',
    setUp: (api: { routes: Record<string, unknown> }) => {
      api.routes['GET /problems'] = ({ url }: { url: URL }) =>
        list(
          url.searchParams.has('typeIds')
            ? [problemItem({ name: LONG_NAME, userCount: 123456789, points: 99999 })]
            : [problemItem({ name: 'A', userCount: 1, points: 1 })],
        );
    },
  },
  {
    name: 'submission list',
    first: '/submissions',
    second: '/submissions?page=2',
    setUp: (api: { routes: Record<string, unknown> }) => {
      api.routes['GET /submissions'] = ({ url }: { url: URL }) =>
        list(
          url.searchParams.get('page') === '2'
            ? [
                submissionItem({
                  problem: { code: 'long', name: LONG_NAME, isDeleted: false },
                  user: { id: 'u', username: 'a_really_long_user_name_here' },
                  memory: 123456789,
                }),
              ]
            : [submissionItem({ memory: 1, points: 1 })],
        );
    },
  },
  {
    name: 'ended contests',
    first: '/contests?phase=ended',
    second: '/contests?phase=ended&page=2',
    setUp: (api: { routes: Record<string, unknown> }) => {
      api.routes['GET /contests'] = ({ url }: { url: URL }) =>
        list([
          contestItem({
            key: url.searchParams.get('page') === '2' ? 'k2' : 'k',
            name: url.searchParams.get('page') === '2' ? LONG_NAME : 'Ngắn',
            phase: 'ended',
            userCount: url.searchParams.get('page') === '2' ? 123456789 : 1,
          }),
        ]);
    },
  },
];

for (const table of TABLE_CASES)
  test(`the ${table.name} columns keep their x when the rows change`, async ({ page, api }) => {
    table.setUp(api);
    await page.goto(table.first);
    await expect(page.locator('#main tbody tr').first()).toBeVisible();
    const before = await headerLefts(page);
    await goInApp(page, table.second);
    await expect(page.locator('#main tbody tr').first()).toContainText(/\S/);
    await page.waitForTimeout(500);
    const after = await headerLefts(page);
    console.log(table.name, JSON.stringify(before), JSON.stringify(after));
    expect(after).toHaveLength(before.length);
    before.forEach((left, index) =>
      expect(Math.abs(after[index] - left), `${table.name} header ${index}`).toBeLessThanOrEqual(
        TOLERANCE_PX,
      ),
    );
  });

test('the ended-contest table keeps a readable name column on a phone', async ({ page, api }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  api.routes['GET /contests'] = list([contestItem({ phase: 'ended', name: LONG_NAME })]);
  await page.goto('/contests?phase=ended');
  const nameHeader = page.locator('#main thead th').first();
  await expect(nameHeader).toBeVisible();
  const box = await nameHeader.boundingBox();
  expect(box!.width).toBeGreaterThan(200);
});

for (const width of [1440, 390])
  test(`the ranking skeleton columns start where the table's do at ${width} px`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    api.routes['GET /contests/r42/ranking'] = { body: { data: longBoard() } };
    const release = api.hold('GET /contests/r42/ranking');
    await page.goto('/contests/r42/ranking');
    const header = page.locator('[data-skeleton-region="table-header"]');
    await expect(header).toBeVisible();
    const skeleton = await lefts(header.locator('> span'));
    release();
    await expect(page.locator('thead th').first()).toBeVisible();
    const table = await lefts(page.locator('thead th'));
    // Skeleton cells: rank, name, then the stats block, which starts at the score column.
    [table[0], table[1], table[2]].forEach((left, index) =>
      expect(Math.abs(skeleton[index] - left), `column ${index}`).toBeLessThanOrEqual(TOLERANCE_PX),
    );
  });

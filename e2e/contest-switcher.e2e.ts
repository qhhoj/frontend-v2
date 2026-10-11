import { contestDetail, contestProblem, problemDetail, viewerResult } from '../src/test/fixtures';
import { CONTEST_FIXTURE_NOW, expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { ok } from './fixtures/reply';

const problems = [
  contestProblem(0, {
    viewerResult: viewerResult({ isSolved: true, attempts: 1 }),
    timeLimit: 1,
    memoryLimit: 262_144,
  }),
  contestProblem(1, {
    viewerResult: viewerResult({ attempts: 2 }),
    timeLimit: 2,
    memoryLimit: 262_144,
  }),
  contestProblem(2, { viewerResult: viewerResult(), timeLimit: null, memoryLimit: null }),
];
const contest = contestDetail({ problems });
// A title of two phone lines, as the header skeleton draws; the default one fits a single line now that the short-link button leaves the title the full row.
function inContest(api: FakeApi) {
  api.signedIn = true;
  api.routes['GET /contests/r42'] = ok(contest);
  for (const problem of problems)
    api.routes[`GET /problems/${problem.code}`] = ok(
      problemDetail({
        code: problem.code,
        name: 'Đường đi qua mê cung',
        contest: { contestKey: 'r42', attemptsLeft: null },
      }),
    );
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(CONTEST_FIXTURE_NOW);
});

test('the rail moves between contest problems and marks the open one', async ({ page, api }) => {
  inContest(api);
  await page.goto('/problems/r42a');
  const rail = page.getByTestId('problem-switcher');
  await expect(rail.locator('[aria-current="page"]')).toContainText(problems[0].name);
  await rail.getByRole('link', { name: new RegExp(problems[1].name) }).click();
  await expect(page).toHaveURL(/\/problems\/r42b$/);
  await expect(rail.locator('[aria-current="page"]')).toContainText(problems[1].name);
});

test('the contest problem table shows one limits column with a dash for a hidden problem', async ({
  page,
  api,
}) => {
  inContest(api);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/contests/r42');
  const table = page.getByTestId('contest-problems');
  await expect(table.getByRole('columnheader', { name: 'Giới hạn' })).toHaveCount(1);
  await expect(table.getByRole('cell', { name: '2 s · 256 MB' })).toBeVisible();
  await expect(table.getByRole('cell', { name: '—', exact: true }).first()).toBeVisible();
});

import { contestDetail, contestProblem, problemDetail, viewerResult } from '../src/test/fixtures';
import { THEMES } from '../src/theme/registry';
import { AUDIT_VIEWPORTS, applyTheme, axeViolationsIn } from './fixtures/audit';
import { CONTEST_FIXTURE_NOW, expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { defineShiftTests, PHONE_AND_DESKTOP } from './fixtures/layout-shift';
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
// The statement keeps problemDetail's default title, which wraps to two lines on a phone as the header skeleton assumes.
function inContest(api: FakeApi) {
  api.signedIn = true;
  api.routes['GET /contests/r42'] = ok(contest);
  for (const problem of problems)
    api.routes[`GET /problems/${problem.code}`] = ok(
      problemDetail({
        code: problem.code,
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

for (const viewport of AUDIT_VIEWPORTS)
  test(`the switcher is accessible in every theme and fits at ${viewport.name}`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    for (const theme of THEMES) {
      inContest(api);
      await applyTheme(page, api, theme);
      await page.goto('/problems/r42b');
      await expect(page.getByTestId('problem-switcher')).toBeVisible();
      expect(await axeViolationsIn(page), theme.id).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  });

defineShiftTests([
  {
    name: 'problem page inside a contest',
    path: '/problems/r42b',
    signedIn: true,
    hold: 'GET /problems/r42b',
    answer: inContest,
    // Offsets are measured from the header, so the rail (beside it from lg, above it below lg) is the declared exception.
    parts: (page) => ({
      header: page.getByTestId('problem-header'),
      tabs: page.locator('[data-skeleton-region="tabs"], [role="tablist"]'),
      statement: page.getByTestId('statement-card'),
    }),
    placed: ['tabs', 'statement'],
    placedOnly: ['statement'],
    viewports: PHONE_AND_DESKTOP,
    clockAt: CONTEST_FIXTURE_NOW,
  },
]);

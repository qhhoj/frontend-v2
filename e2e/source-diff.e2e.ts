import { submissionDetail, submissionItem } from '../src/test/fixtures';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { list, ok } from './fixtures/reply';

const LEFT = 'dif-1';
const RIGHT = 'dif-2';
const DIFF_PATH = `/submissions/diff?left=${LEFT}&right=${RIGHT}`;
const LEFT_SOURCE = Array.from(
  { length: 12 },
  (_unused, index) => `int a${index} = ${index};`,
).join('\n');
const RIGHT_SOURCE = LEFT_SOURCE.replace('int a5 = 5;', 'long long a5 = 5;');

function diffRoutes(api: FakeApi, rightSource = RIGHT_SOURCE) {
  api.signedIn = true;
  api.routes['GET /submissions'] = list([
    submissionItem({ id: LEFT }),
    submissionItem({ id: RIGHT }),
    submissionItem({ id: 'dif-3' }),
  ]);
  api.routes[`GET /submissions/${LEFT}`] = ok(submissionDetail({ id: LEFT }));
  api.routes[`GET /submissions/${RIGHT}`] = ok(submissionDetail({ id: RIGHT }));
  api.routes[`GET /submissions/${LEFT}/source`] = ok({ id: LEFT, source: LEFT_SOURCE });
  api.routes[`GET /submissions/${RIGHT}/source`] = ok({ id: RIGHT, source: rightSource });
}

test('picks two rows in the list and compares them', async ({ page, api }) => {
  diffRoutes(api);
  await page.goto('/submissions');
  await page.getByRole('checkbox', { name: /dif-1/ }).check();
  await page.getByRole('checkbox', { name: /dif-2/ }).check();
  await page.getByTestId('diff-compare').click();
  await expect(page).toHaveURL(new RegExp(`/submissions/diff\\?left=${LEFT}&right=${RIGHT}`));
  await expect(page.getByTestId('diff-summary')).toContainText('+1 dòng');
  await expect(page.locator('tr[data-kind="changed"] [data-word="changed"]').first()).toBeVisible();
});

test('compares from the submission page with the form, this one on the right', async ({
  page,
  api,
}) => {
  diffRoutes(api);
  await page.goto(`/submissions/${RIGHT}`);
  await page.getByLabel('Mã bài nộp hoặc liên kết để so sánh').fill(`/submissions/${LEFT}`);
  await page.getByRole('button', { name: 'So sánh', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/submissions/diff\\?left=${LEFT}&right=${RIGHT}`));
  await expect(page.getByTestId('source-diff')).toBeVisible();
});

test('opens the folded runs of identical lines', async ({ page, api }) => {
  diffRoutes(api);
  await page.goto(DIFF_PATH);
  /** Both layouts are in the DOM; the other one is hidden. */
  const folds = page.locator('[data-testid="diff-fold"]:visible');
  await expect(folds).toHaveCount(2);
  while ((await folds.count()) > 0) await folds.first().click();
  await expect(page.locator('[data-testid="diff-table-wide"] tr[data-kind="same"]')).toHaveCount(
    11,
  );
});

test('shows the named forbidden state with the security Bit', async ({ page, api }) => {
  diffRoutes(api);
  api.routes[`GET /submissions/${LEFT}/source`] = {
    status: 403,
    body: { error: { code: 'solve_first', message: 'solve first' } },
  };
  await page.goto(DIFF_PATH);
  const panel = page.getByTestId('state-panel');
  await expect(panel).toHaveAttribute('data-state', 'forbidden');
  await expect(panel.locator('[data-bit-variant="security"]')).toBeVisible();
});

import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { AUDIT_VIEWPORTS, applyTheme, axeViolationsIn } from './fixtures/audit';
import { DESKTOP, PHONE, defineShiftTests } from './fixtures/layout-shift';
import { list, ok } from './fixtures/reply';
import { submissionDetail, submissionItem } from '../src/test/fixtures';
import { THEMES } from '../src/theme/registry';

const GONE = { code: 'duongdi', name: 'Đường đi', isDeleted: true };
const TOMBSTONED = submissionDetail({ problem: GONE, cases: [], batches: null, totalCases: null });

function tombstoneRoutes(api: FakeApi) {
  api.signedIn = true;
  api.routes[`GET /submissions/${TOMBSTONED.id}`] = ok(TOMBSTONED);
  api.routes[`GET /submissions/${TOMBSTONED.id}/source`] = ok({
    id: TOMBSTONED.id,
    source: 'int main() {}\n',
  });
}

test('the submission of a deleted problem shows the tombstone with Bit and keeps the source', async ({
  page,
  api,
}) => {
  tombstoneRoutes(api);
  await page.goto(`/submissions/${TOMBSTONED.id}`);
  const notice = page.getByTestId('deleted-problem-notice');
  await expect(notice.getByRole('heading', { name: 'Bài đã bị xóa' })).toBeVisible();
  await expect(notice.getByTestId('inline-bit')).toBeVisible();
  await expect(page.getByTestId('cases-card')).toHaveCount(0);
  await expect(page.locator('a[href="/problems/duongdi"]')).toHaveCount(0);
  await expect(page.getByText('int main', { exact: false })).toBeVisible();
});

test('the submission list marks a deleted problem without a link', async ({ page, api }) => {
  api.signedIn = true;
  api.routes['GET /submissions'] = list([submissionItem({ problem: GONE })]);
  await page.goto('/submissions');
  await expect(page.getByText('Đã xóa', { exact: true }).first()).toBeVisible();
  await expect(page.locator('a[href="/problems/duongdi"]')).toHaveCount(0);
});

test('a deleted problem page is the crying-Bit 404', async ({ page, api }) => {
  api.routes['GET /problems/duongdi'] = {
    status: 404,
    body: { error: { code: 'not_found', message: 'Not found' } },
  };
  await page.goto('/problems/duongdi');
  await expect(page.getByRole('heading', { level: 1, name: 'Không tìm thấy trang' })).toBeVisible();
});

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
    test(`the tombstone is accessible in ${theme.id} at ${viewport.name}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize(viewport);
      tombstoneRoutes(api);
      await applyTheme(page, api, theme);
      await page.goto(`/submissions/${TOMBSTONED.id}`);
      await expect(page.getByTestId('deleted-problem-notice')).toBeVisible();
      expect(await axeViolationsIn(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });

defineShiftTests([
  {
    name: 'submission page of a deleted problem',
    path: `/submissions/${TOMBSTONED.id}`,
    signedIn: true,
    hold: `GET /submissions/${TOMBSTONED.id}`,
    answer: tombstoneRoutes,
    parts: (page) => ({ summary: page.getByTestId('submission-summary') }),
    viewports: [PHONE, DESKTOP],
  },
]);

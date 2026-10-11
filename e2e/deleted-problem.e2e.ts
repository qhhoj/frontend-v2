import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { list, ok } from './fixtures/reply';
import { submissionDetail, submissionItem } from '../src/test/fixtures';

const GONE = { code: 'duongdi', name: 'Đường đi', isDeleted: true, points: 100 };
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
  await page.getByTestId('source-expand').click();
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

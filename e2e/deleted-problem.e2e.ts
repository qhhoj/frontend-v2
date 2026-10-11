import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { ok } from './fixtures/reply';
import { submissionDetail } from '../src/test/fixtures';

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

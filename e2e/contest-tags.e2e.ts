import { CONTEST_FIXTURE_NOW, expect, test } from './fixtures/api';
import { adminList, adminOk, signInAsStaff } from './fixtures/admin';

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(CONTEST_FIXTURE_NOW);
});

test('staff add a tag with a colour token and see it in the catalogue', async ({ page, api }) => {
  signInAsStaff(api, ['judge.change_contest_tag']);
  const created = { slug: 'olp', name: 'Olympic', color: 'tag-6', description: '', order: 0 };
  let catalogue: unknown[] = [];
  api.routes['GET /contest-tags'] = () => adminList(catalogue);
  api.routes['POST /contest-tags'] = () => {
    catalogue = [created];
    return adminOk(created);
  };
  await page.goto('/admin/contest-tags');
  await page.getByLabel('Mã thẻ').fill('olp');
  await page.getByLabel('Tên hiển thị').fill('Olympic');
  await page.locator('[data-color="tag-6"]').click();
  await page.getByRole('button', { name: 'Thêm thẻ', exact: true }).click();
  await expect(page.getByTestId('tag-row')).toHaveCount(1);
  await expect(page.getByRole('status').filter({ hasText: 'Đã thêm thẻ.' })).toBeVisible();
});

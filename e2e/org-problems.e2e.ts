import { expect, test } from './fixtures/api';
import { axeViolationsIn } from './fixtures/audit';
import { installOrgProblems } from './fixtures/f4-api';
import { organizationDetail } from '../src/test/community-fixtures';
import { problemDetail } from '../src/test/fixtures';
import { f4Id } from '../src/test/f4-fixtures';

const TAB = '/organizations/lhp/problems';

test('a member reads the list with the community Bit and no admin controls', async ({
  page,
  api,
}) => {
  installOrgProblems(api, { canAdminister: false });
  await page.goto(TAB);
  await expect(page.getByText('Thành viên thường chỉ đọc', { exact: false })).toBeVisible();
  await expect(
    page.getByTestId('org-problems-tab').getByTestId('inline-bit').first(),
  ).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
});

test('a stranger sees the forbidden state with the security Bit', async ({ page, api }) => {
  api.signedIn = true;
  api.routes['GET /organizations/lhp'] = { body: { data: organizationDetail() } };
  await page.goto(TAB);
  await expect(page.locator('[data-testid="state-panel"][data-state="forbidden"]')).toBeVisible();
  await expect(page.locator('[data-bit-variant="security"]')).toBeVisible();
});

test('archives a row and the list reloads', async ({ page, api }) => {
  installOrgProblems(api, { canAdminister: true });
  api.routes['POST /organizations/lhp/problems/lhp_lis/archive'] = { status: 204 };
  await page.goto(TAB);
  await page.getByRole('button', { name: 'Lưu trữ lhp_lis' }).click();
  await expect
    .poll(
      () =>
        api.requests.filter((request) => request.key === 'GET /organizations/lhp/problems').length,
    )
    .toBeGreaterThan(1);
});

test('an admin adds a tag in the catalogue', async ({ page, api }) => {
  installOrgProblems(api, { canAdminister: true });
  api.routes['POST /organizations/lhp/problem-tags'] = {
    status: 201,
    body: { data: { id: 'tag-new', slug: 'ds', name: 'Cấu trúc dữ liệu', color: 'tag-5' } },
  };
  await page.goto(TAB);
  const catalogue = page.getByTestId('org-tag-catalogue');
  await expect(catalogue.getByText('3 / 100')).toBeVisible();
  await catalogue.getByRole('button', { name: 'Thêm thẻ' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Mã thẻ').fill('ds');
  await dialog.getByLabel('Tên thẻ').fill('Cấu trúc dữ liệu');
  await dialog.getByLabel('Màu 5').check();
  expect(await axeViolationsIn(page)).toEqual([]);
  await dialog.getByRole('button', { name: 'Lưu thẻ', exact: true }).click();
  await expect(dialog).toBeHidden();
});

test('bulk archive reports a partial result with the sweating Bit', async ({ page, api }) => {
  installOrgProblems(api, { canAdminister: true });
  api.routes['POST /organizations/lhp/problems/bulk'] = {
    body: {
      data: {
        results: [
          { code: 'lhp_tree', outcome: 'done' },
          { code: 'lhp_sp', outcome: 'skipped', reason: 'not_found' },
        ],
        done: 1,
        skipped: 1,
      },
    },
  };
  await page.goto(TAB);
  await page.getByRole('checkbox', { name: 'Chọn lhp_tree' }).check();
  await page.getByRole('checkbox', { name: 'Chọn lhp_sp' }).check();
  const bar = page.getByTestId('org-bulk-bar');
  await expect(bar.getByText('Đã chọn 2 bài')).toBeVisible();
  expect(await axeViolationsIn(page)).toEqual([]);
  await bar.getByRole('button', { name: 'Lưu trữ', exact: true }).click();
  const result = page.getByTestId('org-bulk-result');
  await expect(result.getByText('1/2 thành công', { exact: false })).toBeVisible();
  await expect(result.getByText('lhp_sp không còn thuộc tổ chức này')).toBeVisible();
  await expect(result.getByTestId('inline-bit')).toBeVisible();
  await expect(bar.getByText('Đã chọn 1 bài')).toBeVisible();
});

test('the problem page shows the archive notice with Bit to a member', async ({ page, api }) => {
  api.signedIn = true;
  const problem = problemDetail({ code: 'caitui', name: 'Cái túi', organizations: [f4Id(301)] });
  api.routes['GET /problems/caitui'] = { body: { data: problem } };
  api.routes['GET /problems/caitui/archived-in'] = {
    body: { data: { organizations: [{ slug: 'lhp', name: 'LHP' }] } },
  };
  await page.goto('/problems/caitui');
  const notice = page.getByTestId('archived-notice');
  await expect(notice).toContainText('Bài này đã được lưu trữ bởi tổ chức LHP');
  await expect(notice.getByTestId('inline-bit')).toBeVisible();
  expect(await axeViolationsIn(page)).toEqual([]);
});

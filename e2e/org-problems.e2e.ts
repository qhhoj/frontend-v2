import { expect, test } from './fixtures/api';
import { axeViolationsIn } from './fixtures/audit';
import { installOrgProblems } from './fixtures/f4-api';

const TAB = '/organizations/lhp/problems';

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

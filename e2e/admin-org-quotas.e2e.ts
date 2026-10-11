import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, applyTheme, axeViolationsIn, AUDIT_THEMES } from './fixtures/audit';
import { adminOk, confirmInDialog, dialogOf, signInAsStaff } from './fixtures/admin';
import { installUsageOverview } from './fixtures/f4-api';
import {
  editableProblem,
  problemData,
  problemEditingMeta,
} from '../src/test/admin-fixtures/problems';
import { usageRow } from '../src/test/f4-fixtures';

const EDIT = ['judge.edit_all_organization'];
const ROWS = [
  usageRow(),
  usageRow({ slug: 'ntt', name: 'NTT', creditsUsed: 10 }),
  usageRow({ slug: 'clb', name: 'CLB', creditsUsed: 0 }),
];

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of AUDIT_THEMES)
    test(`the quota overview is accessible in ${theme.id} at ${viewport.name}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize(viewport);
      signInAsStaff(api, EDIT);
      await applyTheme(page, api, theme);
      installUsageOverview(api, ROWS);
      await page.goto('/admin/organizations/quotas');
      await expect(page.getByText('THPT chuyên Lê Hồng Phong')).toBeVisible();
      expect(await axeViolationsIn(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });

test('edits a quota and says so in a toast', async ({ page, api }) => {
  signInAsStaff(api, EDIT);
  installUsageOverview(api, ROWS);
  api.routes['PATCH /organizations/lhp/quota'] = { body: { data: {} } };
  await page.goto('/admin/organizations/quotas');
  await page.getByRole('button', { name: 'Sửa hạn mức THPT chuyên Lê Hồng Phong' }).click();
  await dialogOf(page).getByLabel('Tín dụng mỗi tháng').fill('300');
  await confirmInDialog(page, 'Lưu hạn mức');
  await expect(page.getByTestId('admin-toasts')).toContainText(
    'Đã lưu hạn mức của THPT chuyên Lê Hồng Phong',
  );
});

test('the admin nav links the overview', async ({ page, api }) => {
  signInAsStaff(api, EDIT);
  installUsageOverview(api, ROWS);
  await page.goto('/admin');
  await page.getByTestId('admin-nav').getByRole('link', { name: 'Hạn mức tổ chức' }).click();
  await expect(page).toHaveURL(/\/admin\/organizations\/quotas$/);
});

test('a clone refused by the quota names the credits and shows the refusal alert', async ({
  page,
  api,
}) => {
  signInAsStaff(api, ['judge.edit_own_problem', 'judge.clone_problem']);
  api.routes['GET /problems/hcmus41c'] = adminOk(editableProblem());
  api.routes['GET /problems/meta'] = adminOk(problemEditingMeta());
  api.routes['GET /problems/hcmus41c/data'] = adminOk(problemData());
  api.routes['POST /problems/hcmus41c/clone'] = {
    status: 403,
    body: {
      error: {
        code: 'quota_exceeded',
        message: 'The organization has no credits left',
        issues: [
          {
            field: 'credits',
            code: 'quota_exceeded',
            message: 'The organization has no credits left',
          },
        ],
        details: { meter: 'credits', limit: 200, used: 194, needed: 10 },
      },
    },
  };
  await page.goto('/admin/problems/hcmus41c/general');
  await page.getByRole('button', { name: 'Thêm', exact: true }).click();
  await page.getByRole('button', { name: 'Nhân bản bài…' }).click();
  await page.locator('#problem-clone-code').fill('hcmus41c_ban_sao');
  await page.locator('#problem-clone-code').press('Enter');
  const alert = page.getByRole('alert').filter({ hasText: 'cần 10, còn lại 6' });
  await expect(alert).toBeVisible();
});

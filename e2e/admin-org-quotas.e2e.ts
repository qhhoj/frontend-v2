import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, applyTheme, axeViolationsIn } from './fixtures/audit';
import { adminOk, confirmInDialog, dialogOf, signInAsStaff } from './fixtures/admin';
import { installUsageOverview } from './fixtures/f4-api';
import { DESKTOP, PHONE, defineShiftTests } from './fixtures/layout-shift';
import { editableProblem, problemEditingMeta } from '../src/test/admin-fixtures/problems';
import { usageRow } from '../src/test/f4-fixtures';
import { THEMES } from '../src/theme/registry';

const EDIT = ['judge.edit_all_organization'];
const ROWS = [
  usageRow(),
  usageRow({ slug: 'ntt', name: 'NTT', creditsUsed: 10 }),
  usageRow({ slug: 'clb', name: 'CLB', creditsUsed: 0 }),
];

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
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

test('edits a quota and says so with the crown Bit', async ({ page, api }) => {
  signInAsStaff(api, EDIT);
  installUsageOverview(api, ROWS);
  api.routes['PATCH /organizations/lhp/quota'] = { body: { data: {} } };
  await page.goto('/admin/organizations/quotas');
  await expect(page.locator('[data-testid="admin-bit"][data-placement="people"]')).toBeVisible();
  await page.getByRole('button', { name: 'Sửa hạn mức THPT chuyên Lê Hồng Phong' }).click();
  await dialogOf(page).getByLabel('Tín dụng mỗi tháng').fill('300');
  await confirmInDialog(page, 'Lưu hạn mức');
  const saved = page.getByRole('status').filter({ hasText: 'Đã lưu hạn mức' });
  await expect(saved).toBeVisible();
  await expect(saved.getByTestId('inline-bit')).toBeVisible();
});

test('the admin nav links the overview', async ({ page, api }) => {
  signInAsStaff(api, EDIT);
  installUsageOverview(api, ROWS);
  await page.goto('/admin');
  await page.getByRole('link', { name: 'Hạn mức tổ chức' }).click();
  await expect(page).toHaveURL(/\/admin\/organizations\/quotas$/);
});

defineShiftTests([
  {
    name: 'staff quota overview',
    path: '/admin/organizations/quotas',
    signedIn: true,
    hold: 'GET /organizations/usage',
    answer: (api) => {
      signInAsStaff(api, EDIT);
      installUsageOverview(api, ROWS);
    },
    parts: (page) => ({ table: page.getByTestId('quota-overview') }),
    viewports: [PHONE, DESKTOP],
  },
]);

test('a clone refused by the quota names the credits with the sweating Bit', async ({
  page,
  api,
}) => {
  signInAsStaff(api, ['judge.edit_own_problem', 'judge.clone_problem']);
  api.routes['GET /problems/hcmus41c'] = adminOk(editableProblem());
  api.routes['GET /problems/meta'] = adminOk(problemEditingMeta());
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
  await page.locator('#problem-clone-code').fill('hcmus41c_ban_sao');
  await page.locator('#problem-clone-code').press('Enter');
  const alert = page.getByRole('alert').filter({ hasText: 'cần 10, còn lại 6' });
  await expect(alert).toBeVisible();
  await expect(alert.getByTestId('inline-bit')).toBeVisible();
});

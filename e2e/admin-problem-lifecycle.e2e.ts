import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, applyTheme, axeViolationsIn } from './fixtures/audit';
import { confirmInDialog, dialogOf, signInAsStaff } from './fixtures/admin';
import { installDeletedProblems } from './fixtures/f4-api';
import { DESKTOP, PHONE, defineShiftTests } from './fixtures/layout-shift';
import { deletedProblem } from '../src/test/f4-fixtures';
import { THEMES } from '../src/theme/registry';

const DELETE = ['judge.delete_problem', 'judge.edit_own_problem'];
const THREE_ROWS = [
  deletedProblem(),
  deletedProblem({ code: 'hethan', name: 'Hết hạn', daysLeft: 0 }),
  deletedProblem({ code: 'cu', name: 'Cũ', isPurged: true, daysLeft: 0 }),
];

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
    test(`the deleted list is accessible in ${theme.id} at ${viewport.name}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize(viewport);
      signInAsStaff(api, DELETE, true);
      await applyTheme(page, api, theme);
      installDeletedProblems(api, THREE_ROWS);
      await page.goto('/admin/problems/deleted');
      await expect(page.getByText('Còn 26 ngày')).toBeVisible();
      expect(await axeViolationsIn(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });

test('restore and purge-now from the deleted list', async ({ page, api }) => {
  signInAsStaff(api, DELETE, true);
  installDeletedProblems(api, THREE_ROWS);
  api.routes['POST /problems/cuvui/restore'] = { status: 204 };
  api.routes['POST /problems/hethan/purge-now'] = { status: 202, body: { data: { queued: true } } };
  await page.goto('/admin/problems/deleted');
  await page.getByRole('button', { name: 'Khôi phục cuvui' }).click();
  const restored = page.getByRole('status').filter({ hasText: 'Đã khôi phục cuvui' });
  await expect(restored).toBeVisible();
  await expect(restored.getByTestId('inline-bit')).toBeVisible();
  await page.getByRole('button', { name: 'Xóa hẳn hethan ngay' }).click();
  await dialogOf(page).getByLabel('Gõ mã bài hethan để xác nhận').fill('hethan');
  await confirmInDialog(page, 'Xóa hẳn');
  const queued = page.getByRole('status').filter({ hasText: 'Đã xếp lịch xóa hẳn hethan' });
  await expect(queued).toBeVisible();
  await expect(queued.getByTestId('inline-bit')).toBeVisible();
});

test('an empty deleted list shows the staff Bit', async ({ page, api }) => {
  signInAsStaff(api, DELETE);
  installDeletedProblems(api, []);
  await page.goto('/admin/problems/deleted');
  await expect(page.getByText('Không có bài nào đã xóa.')).toBeVisible();
  await expect(page.locator('[data-testid="admin-bit"][data-placement="empty"]')).toBeVisible();
});

test('the problems index links to the deleted tab', async ({ page, api }) => {
  signInAsStaff(api, DELETE);
  api.routes['GET /problems'] = { body: { data: [], meta: { page: 1, pageSize: 20, total: 0 } } };
  installDeletedProblems(api, []);
  await page.goto('/admin/problems');
  await page.getByRole('link', { name: 'Đã xóa' }).click();
  await expect(page).toHaveURL(/\/admin\/problems\/deleted$/);
});

defineShiftTests([
  {
    name: 'deleted problem list',
    path: '/admin/problems/deleted',
    signedIn: true,
    hold: 'GET /problems/deleted',
    answer: (api) => {
      signInAsStaff(api, DELETE);
      installDeletedProblems(api, THREE_ROWS);
    },
    parts: (page) => ({ list: page.getByTestId('deleted-problems') }),
    viewports: [PHONE, DESKTOP],
  },
]);

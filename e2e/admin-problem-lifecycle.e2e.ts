import { expect, test } from './fixtures/api';
import { adminOk, confirmInDialog, dialogOf, signInAsStaff } from './fixtures/admin';
import { installDeletedProblems } from './fixtures/f4-api';
import { editableProblem, problemEditingMeta } from '../src/test/admin-fixtures/problems';
import { deletedProblem } from '../src/test/f4-fixtures';

const DELETE = ['judge.delete_problem', 'judge.edit_own_problem'];
const THREE_ROWS = [
  deletedProblem(),
  deletedProblem({ code: 'hethan', name: 'Hết hạn', daysLeft: 0 }),
  deletedProblem({ code: 'cu', name: 'Cũ', isPurged: true, daysLeft: 0 }),
];

test('restore and purge-now from the deleted list', async ({ page, api }) => {
  signInAsStaff(api, DELETE, true);
  installDeletedProblems(api, THREE_ROWS);
  api.routes['POST /problems/cuvui/restore'] = { status: 204 };
  api.routes['POST /problems/hethan/purge-now'] = { status: 202, body: { data: { queued: true } } };
  await page.goto('/admin/problems/deleted');
  await page.getByRole('button', { name: 'Khôi phục cuvui' }).click();
  const toasts = page.getByTestId('admin-toasts');
  await expect(toasts).toContainText('Đã khôi phục cuvui');
  await page.getByRole('button', { name: 'Thao tác khác cho hethan' }).click();
  await page.getByRole('menuitem', { name: 'Xóa hẳn ngay' }).click();
  await dialogOf(page).getByLabel('Gõ mã bài hethan để xác nhận').fill('hethan');
  await confirmInDialog(page, 'Xóa hẳn');
  await expect(toasts).toContainText('Đã xếp lịch xóa hẳn hethan');
});

test('the problems index links to the deleted tab', async ({ page, api }) => {
  signInAsStaff(api, DELETE);
  api.routes['GET /problems'] = { body: { data: [], meta: { page: 1, pageSize: 20, total: 0 } } };
  installDeletedProblems(api, []);
  await page.goto('/admin/problems');
  await page.getByRole('link', { name: 'Đã xóa' }).click();
  await expect(page).toHaveURL(/\/admin\/problems\/deleted$/);
});

test('the danger zone deletes after the code is typed and lands on the deleted list', async ({
  page,
  api,
}) => {
  signInAsStaff(api, DELETE);
  api.routes['GET /problems/hcmus41c'] = adminOk(editableProblem());
  api.routes['GET /problems/meta'] = adminOk(problemEditingMeta());
  api.routes['DELETE /problems/hcmus41c'] = { status: 204 };
  installDeletedProblems(api, [deletedProblem({ code: 'hcmus41c', daysLeft: 30 })]);
  await page.goto('/admin/problems/hcmus41c/general');
  await expect(page.getByRole('heading', { name: 'Vùng nguy hiểm' })).toBeVisible();
  await page.getByRole('button', { name: 'Xóa bài…' }).click();
  await expect(
    dialogOf(page).getByRole('button', { name: 'Xóa bài', exact: true }),
  ).toHaveAttribute('aria-disabled', 'true');
  await dialogOf(page).getByLabel('Gõ mã bài hcmus41c để xác nhận').fill('hcmus41c');
  await confirmInDialog(page, 'Xóa bài');
  await expect(page).toHaveURL(/\/admin\/problems\/deleted$/);
  await expect(page.getByText('Còn 30 ngày')).toBeVisible();
});

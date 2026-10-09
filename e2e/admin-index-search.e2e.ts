import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminList, signInAsStaff } from './fixtures/admin';
import { adminContestItem, adminProblemItem } from '../src/test/admin-fixtures/index-search';
import { contestEditorRoutes, editableContest } from '../src/test/admin-fixtures/contests';

for (const viewport of AUDIT_VIEWPORTS)
  test(`contests index at ${viewport.name}: search narrows by phase, opens the editor and is accessible`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, ['judge.edit_own_contest']);
    api.routes['GET /contests'] = ({ url }) =>
      adminList(url.searchParams.get('phase') === 'ended' ? [] : [adminContestItem()]);
    Object.assign(api.routes, contestEditorRoutes(editableContest({ key: 'hcmus-2026-r1' })));
    await page.goto('/admin/contests?q=hcmus');
    await expect(page.getByRole('link', { name: /HCMUS Open 2026/ }).first()).toBeVisible();
    expect(await axeViolationsIn(page)).toEqual([]);

    await page.getByRole('link', { name: 'Đã kết thúc' }).click();
    await expect(page).toHaveURL(/phase=ended/);
    await expect(page.getByText('Không có kỳ thi nào khớp “hcmus”')).toBeVisible();

    await page.getByRole('link', { name: 'Tất cả' }).click();
    await page
      .getByRole('link', { name: /HCMUS Open 2026/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/admin\/contests\/hcmus-2026-r1\/general/);
  });

test('problems index: a typed search reaches the address, and open-by-code still works', async ({
  page,
  api,
}) => {
  signInAsStaff(api, ['judge.edit_own_problem']);
  api.routes['GET /problems'] = ({ url }) =>
    adminList(url.searchParams.get('search') ? [adminProblemItem()] : []);
  await page.goto('/admin/problems');
  await page.getByRole('searchbox').fill('cây');
  await expect(page).toHaveURL(/q=c%C3%A2y|q=cây/);
  await expect(page.getByRole('link', { name: 'Cây khung nhỏ nhất' }).first()).toBeVisible();
  expect(await axeViolationsIn(page)).toEqual([]);
});

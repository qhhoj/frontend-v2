import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminOk, signInAsStaff } from './fixtures/admin';
import type { FakeApi } from './fixtures/api';
import type { Page } from '@playwright/test';
import { editableProblem, problemEditingMeta } from '../src/test/admin-fixtures/problems';

const openEditor = async (page: Page, api: FakeApi, tab: string) => {
  signInAsStaff(api, ['judge.edit_own_problem']);
  api.routes['GET /problems/hcmus41c'] = adminOk(editableProblem());
  api.routes['GET /problems/meta'] = adminOk(problemEditingMeta());
  await page.goto(`/admin/problems/hcmus41c/${tab}`);
};

for (const viewport of AUDIT_VIEWPORTS)
  test(`general tab is accessible and fits at ${viewport.name}`, async ({ page, api }) => {
    await page.setViewportSize(viewport);
    await openEditor(page, api, 'general');
    await expect(page.getByLabel('Tên bài')).toHaveValue('Đường đi ngắn nhất có ràng buộc');
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

test('the people chips and switches are reachable by keyboard', async ({ page, api }) => {
  await openEditor(page, api, 'general');
  await page.getByLabel('Người thử bài (testers)').focus();
  await expect(page.getByRole('button', { name: 'Bỏ khoa.tester' })).toBeVisible();
  await page.getByRole('switch', { name: 'Công khai' }).focus();
  await expect(page.getByRole('switch', { name: 'Công khai' })).toBeFocused();
});

for (const viewport of AUDIT_VIEWPORTS)
  test(`statements tab with a live preview is accessible at ${viewport.name}`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    api.routes['POST /problems/render-preview'] = adminOk({ html: '<p>Cho đồ thị</p>' });
    await openEditor(page, api, 'statements');
    await expect(page.getByText('Cho đồ thị', { exact: true })).toBeVisible();
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

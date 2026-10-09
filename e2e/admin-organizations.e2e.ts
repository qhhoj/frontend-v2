import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminList, adminOk, signInAsStaff } from './fixtures/admin';
import { member, organizationDetail, organizationItem } from '../src/test/community-fixtures';

const PERMISSIONS = ['judge.edit_all_organization', 'judge.add_organization'];
const DETAIL = organizationDetail({
  about: 'Câu lạc bộ Tin học.',
  slots: 200,
  viewer: { isMember: false, canAdminister: true, pendingRequestId: null },
});

function organizationRoutes(api: FakeApi) {
  signInAsStaff(api, PERMISSIONS);
  api.routes['GET /organizations'] = adminList([
    organizationItem(),
    organizationItem({ slug: 'ntt-club', name: 'CLB Tin học', isUnlisted: true }),
  ]);
  api.routes['GET /organizations/lhp'] = adminOk(DETAIL);
  api.routes['GET /organizations/lhp/requests'] = adminList([]);
  api.routes['GET /organizations/lhp/members'] = adminList([member(1, 'ngocanh')]);
}

for (const viewport of AUDIT_VIEWPORTS)
  test(`organization list and editor are accessible and fit at ${viewport.name}`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    organizationRoutes(api);
    await page.goto('/admin/organizations?org=lhp');
    await expect(page.locator('#org-name')).toHaveValue('THPT chuyên Lê Hồng Phong');
    await expect(page.getByTestId('org-list')).toContainText('Ẩn');
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

test('the editor stacks under the list on a phone', async ({ page, api }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  organizationRoutes(api);
  await page.goto('/admin/organizations?org=lhp');
  const listBox = await page.getByTestId('org-list').boundingBox();
  const nameBox = await page.locator('#org-name').boundingBox();
  expect(listBox && nameBox && nameBox.y > listBox.y + listBox.height - 1).toBe(true);
});

import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminList, adminOk, signInAsStaff } from './fixtures/admin';
import {
  communityId,
  joinRequest,
  member,
  organizationDetail,
  organizationItem,
} from '../src/test/community-fixtures';

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
  api.routes['GET /admin/organization-requests'] = adminList([]);
}

/** The queue answers from a live list, so an accept removes its row the way the backend would. */
function queueRoutes(api: FakeApi) {
  const pending = [
    joinRequest({ id: communityId(511), organizationSlug: 'lhp', username: 'bichphuong' }),
  ];
  api.routes['GET /admin/organization-requests'] = ({ url }) =>
    url.searchParams.get('state') === 'P' || url.searchParams.get('state') === null
      ? adminList(pending, { total: pending.length, pageSize: 50 })
      : adminList([], { total: 0, pageSize: 50 });
  api.routes[`POST /organizations/lhp/requests/${communityId(511)}/decide`] = () => {
    const [decided] = pending.splice(0, 1);
    return adminOk({ ...decided, state: 'A' });
  };
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

test('an accepted request leaves the queue and the list search marks its match', async ({
  page,
  api,
}) => {
  organizationRoutes(api);
  queueRoutes(api);
  await page.goto('/admin/organizations');
  await expect(page.getByTestId('pending-count')).toHaveText('1');
  await page.getByRole('searchbox', { name: 'Tìm tổ chức' }).fill('cl');
  await expect(page.getByTestId('org-list').locator('mark').first()).toHaveText('CL');
  await page.getByTestId('view-requests').click();
  await page.getByRole('button', { name: 'Chấp nhận' }).click();
  await expect(page.getByTestId('queue-row')).toHaveCount(0);
  await expect(page.getByTestId('pending-count')).toHaveCount(0);
});

for (const viewport of AUDIT_VIEWPORTS)
  test(`the request queue is accessible and fits at ${viewport.name}`, async ({ page, api }) => {
    await page.setViewportSize(viewport);
    organizationRoutes(api);
    queueRoutes(api);
    await page.goto('/admin/organizations?view=requests');
    await expect(page.getByTestId('queue-row')).toHaveCount(1);
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

test('a viewer who may only add organizations has no queue tab', async ({ page, api }) => {
  signInAsStaff(api, ['judge.add_organization']);
  api.routes['GET /organizations'] = adminList([organizationItem()]);
  await page.goto('/admin/organizations');
  await expect(page.getByTestId('org-list')).toBeVisible();
  await expect(page.getByTestId('view-requests')).toHaveCount(0);
});

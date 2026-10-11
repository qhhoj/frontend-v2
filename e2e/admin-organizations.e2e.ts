import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
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

test('a viewer who may only add organizations has no queue tab', async ({ page, api }) => {
  signInAsStaff(api, ['judge.add_organization']);
  api.routes['GET /organizations'] = adminList([organizationItem()]);
  await page.goto('/admin/organizations');
  await expect(page.getByTestId('org-list')).toBeVisible();
  await expect(page.getByTestId('view-requests')).toHaveCount(0);
});

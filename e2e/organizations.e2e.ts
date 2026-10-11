import { joinRequest, organizationDetail } from '../src/test/community-fixtures';
import { expect, list, test } from './fixtures/api';
import { ok } from './fixtures/reply';
import { PHONE, DESKTOP } from './fixtures/viewports';

const VIEWPORTS = [
  { name: 'desktop', width: DESKTOP, height: 800 },
  { name: 'phone 375 px', width: PHONE, height: 812 },
] as const;
const LIST_NAME = 'THPT chuyên Lê Hồng Phong';

for (const viewport of VIEWPORTS)
  test(`the organization list does not scroll the page sideways at ${viewport.name}`, async ({
    page,
    api,
  }) => {
    void api; // installs the fake API
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/organizations');
    await expect(page.getByText(LIST_NAME, { exact: true }).first()).toBeVisible();
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });

const REQUEST_ID = 'c0ffee00-0000-4000-8000-000000000501';
const HCMUS = {
  slug: 'hcmus',
  name: 'Đội tuyển HCMUS',
  shortName: 'HCMUS',
  isOpen: false,
  slots: 60,
  memberCount: 48,
};
const NOT_A_MEMBER = { isMember: false, canAdminister: false, pendingRequestId: null };
const ADMINISTRATOR = { isMember: true, canAdminister: true, pendingRequestId: null };

test('a signed-in visitor joins an open organization and the panel turns to member', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  let joined = false;
  api.routes['GET /organizations/lhp'] = () =>
    ok(
      organizationDetail({
        viewer: { isMember: joined, canAdminister: false, pendingRequestId: null },
      }),
    );
  api.routes['POST /organizations/lhp/join'] = () => {
    joined = true;
    return { status: 204 };
  };
  await page.goto('/organizations/lhp');
  await page.getByRole('button', { name: 'Tham gia tổ chức' }).click();
  await expect(page.getByText('Bạn là thành viên', { exact: true }).first()).toBeVisible();
});

test('a signed-in visitor asks to join a private organization and sees the request pending', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  let pending = false;
  const request = joinRequest({ id: REQUEST_ID, organizationSlug: 'hcmus' });
  api.routes['GET /organizations/hcmus'] = () =>
    ok(
      organizationDetail({
        ...HCMUS,
        viewer: { ...NOT_A_MEMBER, pendingRequestId: pending ? REQUEST_ID : null },
      }),
    );
  api.routes['POST /organizations/hcmus/requests'] = () => {
    pending = true;
    return ok(request);
  };
  api.routes[`GET /organizations/hcmus/requests/${REQUEST_ID}`] = ok(request);
  await page.goto('/organizations/hcmus');
  await page.getByLabel('Lý do (bắt buộc, tối đa 4096 ký tự)').fill('Em muốn tham gia đội tuyển.');
  await page.getByRole('button', { name: 'Gửi yêu cầu' }).click();
  await expect(page.getByText('Đang chờ duyệt', { exact: true }).first()).toBeVisible();
});

test('an administrator approves a pending request on "Quản lý" and the queue empties', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  let decided = false;
  api.routes['GET /organizations/hcmus'] = ok(
    organizationDetail({ ...HCMUS, viewer: ADMINISTRATOR }),
  );
  api.routes['GET /organizations/hcmus/requests'] = () =>
    list(decided ? [] : [joinRequest({ id: REQUEST_ID, organizationSlug: 'hcmus' })]);
  api.routes[`POST /organizations/hcmus/requests/${REQUEST_ID}/decide`] = () => {
    decided = true;
    return ok(joinRequest({ id: REQUEST_ID, organizationSlug: 'hcmus', state: 'A' }));
  };
  api.routes['GET /organizations/hcmus/members'] = list([]);
  api.routes['GET /organizations/hcmus/revisions'] = list([]);
  api.routes['POST /organizations/render-preview'] = ok({ html: '' });
  // The old requests address lands on "Quản lý".
  await page.goto('/organizations/hcmus/requests');
  await expect(page).toHaveURL(/\/organizations\/hcmus\/manage$/);
  await page.getByRole('button', { name: 'Chấp nhận', exact: true }).click();
  await expect(page.getByText('Không có yêu cầu nào.', { exact: true })).toBeVisible();
});

test('the members table does not scroll the page sideways at 375 px', async ({ page, api }) => {
  void api; // installs the fake API
  await page.setViewportSize({ width: PHONE, height: 812 });
  await page.goto('/organizations/lhp/members');
  await expect(page.getByText('tuanlq', { exact: true }).first()).toBeVisible();
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
});

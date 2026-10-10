import { joinRequest, organizationDetail } from '../src/test/community-fixtures';
import { THEMES } from '../src/theme/registry';
import { applyTheme, expectNoAxeViolations } from './fixtures/audit';
import { expect, list, test } from './fixtures/api';
import { ok } from './fixtures/reply';
import { PHONE, DESKTOP } from './fixtures/viewports';

const VIEWPORTS = [
  { name: 'desktop', width: DESKTOP, height: 800 },
  { name: 'phone 375 px', width: PHONE, height: 812 },
] as const;
const LIST_NAME = 'THPT chuyên Lê Hồng Phong';
const ABOUT_TEXT = 'Câu lạc bộ Tin học.';

const PAGES = [
  { name: 'the list', path: '/organizations', ready: LIST_NAME },
  { name: 'an organization', path: '/organizations/lhp', ready: ABOUT_TEXT },
] as const;

for (const viewport of VIEWPORTS)
  for (const theme of THEMES)
    for (const { name, path, ready } of PAGES)
      test(`${name} has no WCAG 2.1 A/AA violations in ${theme.id}, ${viewport.name}`, async ({
        page,
        api,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await applyTheme(page, api, theme);
        await page.goto(path);
        await expect(
          page.getByText(ready, { exact: true }).filter({ visible: true }).first(),
        ).toBeVisible();
        await expectNoAxeViolations(page);
      });

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

test('an unknown organization shows the crying Bit and a way back to the list', async ({
  page,
  api,
}) => {
  api.routes['GET /organizations/khong-co'] = {
    status: 404,
    body: { error: { code: 'not_found', message: 'Not found' } },
  };
  await page.goto('/organizations/khong-co');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Không tìm thấy tổ chức' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Xem các tổ chức' }).click();
  await expect(page).toHaveURL(/\/organizations$/);
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

test('an administrator approves a pending request and the queue empties', async ({ page, api }) => {
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
  await page.goto('/organizations/hcmus/requests');
  await page.getByRole('button', { name: 'Duyệt', exact: true }).click();
  await expect(page.getByText('Không có yêu cầu nào đang chờ', { exact: true })).toBeVisible();
});

/** The membership screens, each in the viewer state that draws it; `ready` is text the loaded screen shows. */
const MEMBERSHIP_PAGES = [
  {
    name: 'the request form',
    path: '/organizations/hcmus',
    detail: organizationDetail({ ...HCMUS, viewer: NOT_A_MEMBER }),
    ready: 'Gửi yêu cầu tham gia',
    requests: {},
  },
  {
    name: 'the pending panel',
    path: '/organizations/hcmus',
    detail: organizationDetail({
      ...HCMUS,
      viewer: { ...NOT_A_MEMBER, pendingRequestId: REQUEST_ID },
    }),
    ready: 'Đang chờ duyệt',
    requests: {
      [`GET /organizations/hcmus/requests/${REQUEST_ID}`]: ok(
        joinRequest({ organizationSlug: 'hcmus' }),
      ),
    },
  },
  {
    name: 'the admin queue',
    path: '/organizations/hcmus/requests',
    detail: organizationDetail({ ...HCMUS, viewer: ADMINISTRATOR }),
    ready: 'Duyệt',
    requests: {
      'GET /organizations/hcmus/requests': list([joinRequest({ organizationSlug: 'hcmus' })]),
    },
  },
  {
    name: 'the members page',
    path: '/organizations/lhp/members',
    detail: organizationDetail(),
    ready: 'tuanlq',
    requests: {},
  },
] as const;

for (const viewport of VIEWPORTS)
  for (const theme of THEMES)
    for (const membershipPage of MEMBERSHIP_PAGES)
      test(`${membershipPage.name} has no WCAG 2.1 A/AA violations in ${theme.id}, ${viewport.name}`, async ({
        page,
        api,
      }) => {
        api.signedIn = true;
        api.routes[`GET /organizations/${membershipPage.detail.slug}`] = ok(membershipPage.detail);
        Object.assign(api.routes, membershipPage.requests);
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await applyTheme(page, api, theme);
        await page.goto(membershipPage.path);
        await expect(
          page.getByText(membershipPage.ready, { exact: true }).filter({ visible: true }).first(),
        ).toBeVisible();
        await expectNoAxeViolations(page);
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

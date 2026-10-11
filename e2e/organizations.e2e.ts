import { joinRequest, member, organizationDetail } from '../src/test/community-fixtures';
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
const NOT_A_MEMBER = {
  isMember: false,
  canAdminister: false,
  canCreateProblem: false,
  canCreateContest: false,
  pendingRequestId: null,
};
const ADMINISTRATOR = {
  isMember: true,
  canAdminister: true,
  canCreateProblem: false,
  canCreateContest: false,
  pendingRequestId: null,
};

test('a signed-in visitor joins an open organization and the panel turns to member', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  let joined = false;
  api.routes['GET /organizations/lhp'] = () =>
    ok(
      organizationDetail({
        viewer: {
          isMember: joined,
          canAdminister: false,
          canCreateProblem: false,
          canCreateContest: false,
          pendingRequestId: null,
        },
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

const LONG_REASON =
  'Em là học sinh lớp 11 chuyên Tin, muốn tham gia đội tuyển để luyện tập cùng các bạn trước kỳ thi chọn học sinh giỏi cấp tỉnh sắp tới. '.repeat(
    2,
  );

test('on "Quản lý" at 1280 px Chấp nhận is in view without scrolling and the ⋯ menu shows its items', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  api.routes['GET /organizations/hcmus'] = ok(
    organizationDetail({ ...HCMUS, viewer: ADMINISTRATOR }),
  );
  api.routes['GET /organizations/hcmus/requests'] = list([
    joinRequest({ id: REQUEST_ID, organizationSlug: 'hcmus', reason: LONG_REASON }),
  ]);
  api.routes['GET /organizations/hcmus/members'] = list([
    member(1, 'a_member_with_a_really_long_username'),
  ]);
  api.routes['GET /organizations/hcmus/revisions'] = list([]);
  api.routes['POST /organizations/render-preview'] = ok({ html: '' });
  await page.setViewportSize({ width: DESKTOP, height: 900 });
  await page.goto('/organizations/hcmus/manage');
  const accept = page.getByRole('button', { name: 'Chấp nhận', exact: true });
  await expect(accept).toBeVisible();
  await expect(page.getByTestId('member-row')).toBeVisible();
  // Neither table (the requests, the members) scrolls sideways inside its card.
  const scrolls = await page
    .getByRole('region')
    .evaluateAll((all) => all.filter((el) => el.scrollWidth > el.clientWidth).length);
  expect(scrolls).toBe(0);
  await expect(accept).toBeInViewport({ ratio: 1 });
  const menuButton = page.getByRole('button', { name: /^Thao tác khác cho/ });
  await expect(menuButton).toBeInViewport({ ratio: 1 });
  await menuButton.click();
  await expect(page.getByRole('menuitem', { name: 'Từ chối' })).toBeVisible();
});

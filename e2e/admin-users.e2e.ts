import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminList, adminOk, confirmInDialog, dialogOf, signInAsStaff } from './fixtures/admin';
import { sessionResponse, sessionUser, userPage } from '../src/test/fixtures';
import { staffUser } from '../src/test/admin-fixtures/users';

const TARGET_ID = '0192a000-0000-7000-8000-00000000c101';
const STAFF_ID = '0192a000-0000-7000-8000-00000000a001';
const target = userPage({
  id: TARGET_ID,
  username: 'tuan_k',
  displayName: 'tuan_k',
  displayRank: 'user',
  staff: { isSuperuser: false, banReason: null },
});

for (const viewport of AUDIT_VIEWPORTS)
  test(`users at ${viewport.name}: the list, the exact lookup and a ban with its reason, accessible`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, ['judge.ban_user']);
    api.routes['GET /admin/users'] = adminList(
      [
        staffUser(),
        staffUser({
          id: 'u-2',
          username: 'spammer',
          displayRank: 'banned',
          banReason: 'Spam blog',
        }),
      ],
      { total: 2 },
    );
    api.routes['GET /users/tuan_k'] = adminOk(target);
    api.routes['POST /users/tuan_k/ban'] = { status: 204 };
    await page.goto('/admin/users');
    await expect(page.getByText('spammer')).toBeVisible();
    await page.getByLabel('Tên đăng nhập').fill('tuan_k');
    await page.getByRole('button', { name: 'Tra cứu', exact: true }).click();
    await expect(page.getByTestId('user-card')).toContainText(TARGET_ID);
    await page.getByLabel('Lý do (bắt buộc, hiện cho người bị cấm)').fill('Spam blog');
    await page.getByRole('button', { name: 'Cấm người dùng', exact: true }).click();
    await expect(dialogOf(page)).toBeVisible();
    expect(await axeViolationsIn(page)).toEqual([]);
    await confirmInDialog(page, 'Cấm');
    await expect(dialogOf(page)).toBeHidden();
    expect(api.requestsTo('POST /users/tuan_k/ban')).toHaveLength(1);
  });

test('a superuser views as a user: the bar shows on the home page and its stop button returns the staff session', async ({
  page,
  api,
}) => {
  signInAsStaff(api, ['judge.ban_user'], true);
  const staff = sessionResponse({
    user: sessionUser({
      id: STAFF_ID,
      username: 'minhthu',
      isStaff: true,
      isSuperuser: true,
      permissions: ['judge.ban_user'],
    }),
  });
  const viewed = sessionResponse({
    user: sessionUser({ id: TARGET_ID, username: 'tuan_k' }),
    impersonatorId: STAFF_ID,
  });
  api.routes['GET /admin/users'] = adminList([staffUser()], { total: 1 });
  api.routes['GET /users/tuan_k'] = adminOk(target);
  api.routes[`POST /auth/impersonate/${TARGET_ID}`] = () => {
    api.routes['GET /auth/me'] = adminOk(viewed);
    return adminOk(viewed);
  };
  api.routes['POST /auth/impersonate/stop'] = () => {
    api.routes['GET /auth/me'] = adminOk(staff);
    return adminOk(staff);
  };
  await page.goto('/admin/users?user=tuan_k');
  await page.getByRole('button', { name: 'Đóng vai tuan_k', exact: true }).click();
  await confirmInDialog(page, 'Bắt đầu đóng vai');
  const bar = page.getByRole('region', { name: 'Đang xem dưới tên người khác' });
  await expect(bar).toBeVisible();
  await bar.getByRole('button', { name: 'Dừng xem' }).click();
  await expect(bar).toBeHidden();
  expect(api.requestsTo('POST /auth/impersonate/stop')).toHaveLength(1);
});

test('the staff list filters by the banned tab and a username prefix, and its table is keyboard-scrollable at each width', async ({
  page,
  api,
}) => {
  signInAsStaff(api, ['judge.ban_user']);
  const members = [
    staffUser(),
    staffUser({
      id: 'u-2',
      username: 'spammer',
      displayRank: 'banned',
      banReason: 'Spam blog',
    }),
    staffUser({ id: 'u-3', username: 'moi_dk', isActive: false }),
  ];
  api.routes['GET /admin/users'] = ({ url }) => {
    const banned = url.searchParams.get('banned');
    const prefix = (url.searchParams.get('search') ?? '').toLowerCase();
    const items = members
      .filter((user) => banned === null || String(user.banReason !== null) === banned)
      .filter((user) => user.username.startsWith(prefix));
    return adminList(items, { total: items.length });
  };
  await page.goto('/admin/users');
  await expect(page.getByTestId('user-row')).toHaveCount(3);
  await page.getByTestId('tab-banned').click();
  await expect(page.getByTestId('user-row')).toHaveCount(1);
  await expect(page.getByRole('columnheader', { name: 'Lý do cấm' })).toBeVisible();
  await page.getByTestId('tab-all').click();
  await page.getByLabel('Tìm người dùng').fill('mo');
  await expect(page).toHaveURL(/q=mo/);
  await expect(page.getByTestId('user-row')).toHaveCount(1);
  await page.getByRole('button', { name: 'Xóa ô tìm' }).click();
  await expect(page.getByTestId('user-row')).toHaveCount(3);
  for (const viewport of AUDIT_VIEWPORTS) {
    await page.setViewportSize(viewport);
    const region = page.getByRole('region', { name: 'Danh sách người dùng' });
    await region.focus();
    await expect(region).toBeFocused();
    expect(await axeViolationsIn(page)).toEqual([]);
  }
});

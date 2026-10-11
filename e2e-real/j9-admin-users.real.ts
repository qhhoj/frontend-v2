import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { getData, postData, signIn, submitLoginForm, uniqueName } from './support';

/**
 * J9: the users list and the edit drawer against the real API. A superuser edits a new account in every tab; the staff
 * member it promotes is then held to the rules: no superuser, not themselves, access read-only.
 */
const STAFF = uniqueName('u1staff').toLowerCase();
const SUPER = uniqueName('u1super').toLowerCase();
const PLAIN = uniqueName('u1plain').toLowerCase();
/** PLAIN after the rename test. */
const SUPER_PLAIN = () => `${PLAIN}_r`;
const START_PASSWORD = 'first pass phrase 31';
const STAFF_PASSWORD = 'staff pass phrase 42';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'e2e-admin-pass-1';
const STAFF_PERMISSIONS = [
  'Sửa hồ sơ người dùng',
  'Cấm người dùng và xem danh sách tài khoản',
  'Đổi e-mail, mật khẩu và trạng thái tài khoản',
];

interface Access {
  isStaff: boolean;
  isSuperuser: boolean;
  permissions: string[];
}

const rowOf = (page: Page, username: string) =>
  page.getByTestId('user-row').filter({ hasText: username });

/** Finds the user by prefix and opens the drawer from its row. */
async function openDrawer(page: Page, username: string, tab?: string): Promise<Locator> {
  await page.goto('/admin/users');
  await page.getByLabel('Tìm người dùng').fill(username);
  await page.getByRole('button', { name: `Mở ${username}`, exact: true }).click();
  const drawer = page.getByRole('dialog', { name: username });
  await expect(drawer.getByTestId('user-edit')).toBeVisible();
  if (tab) await drawer.getByRole('link', { name: tab, exact: true }).click();
  return drawer;
}

test.describe.configure({ mode: 'serial' });

test.describe('J9 admin users', () => {
  test('a superuser creates an account from the header and cannot open their own row', async ({
    page,
  }) => {
    await signIn(page, 'admin');
    await page.goto('/admin/users');
    const own = rowOf(page, 'e2e_admin');
    await expect(own).toContainText('Bạn');
    await expect(own.getByTestId('user-edit-open')).toHaveCount(0);
    await page.goto('/admin/users?user=e2e_admin');
    await expect(page.getByTestId('user-edit-locked')).toContainText('tài khoản của bạn');

    await page.goto('/admin/users');
    await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
    const create = page.getByRole('dialog', { name: 'Tạo tài khoản' });
    await create.getByLabel('Tên đăng nhập').fill(STAFF);
    await create.getByLabel('Mật khẩu', { exact: true }).fill(START_PASSWORD);
    await create.getByRole('button', { name: 'Tạo 1 tài khoản' }).click();
    await expect(create.getByText('Đã tạo', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await postData(page, '/admin/users', {
      users: [
        { username: SUPER, password: START_PASSWORD },
        { username: PLAIN, password: START_PASSWORD },
      ],
    });
  });

  test('the profile tab saves from the footer, and closing over a draft asks first', async ({
    page,
  }) => {
    await signIn(page, 'admin');
    const drawer = await openDrawer(page, STAFF);
    await drawer.getByLabel('Họ và tên').fill('Nhân Viên U1');
    await expect(drawer.getByText('1 thay đổi chưa lưu')).toBeVisible();
    await drawer.getByRole('button', { name: 'Lưu hồ sơ' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Đã lưu hồ sơ.' })).toBeVisible();
    const profile = await getData<{ fullName: string }>(page, `/admin/users/${STAFF}/profile`);
    expect(profile.fullName).toBe('Nhân Viên U1');

    await drawer.getByLabel('Ghi chú nội bộ').fill('nháp');
    await page.keyboard.press('Escape');
    const leave = page.getByRole('dialog', { name: 'Rời trang?' });
    await expect(leave).toBeVisible();
    await leave.getByRole('button', { name: 'Ở lại' }).click();
    await expect(drawer.getByLabel('Ghi chú nội bộ')).toHaveValue('nháp');
    await drawer.getByRole('button', { name: 'Huỷ thay đổi' }).click();
    await expect(drawer.getByLabel('Ghi chú nội bộ')).toHaveValue('');
    await drawer.getByRole('button', { name: 'Đóng' }).click();
    await expect(drawer).toBeHidden();
    await expect(page).not.toHaveURL(/user=/);
  });

  test('the access tab grants staff and permissions, and the superuser flag, with no password', async ({
    page,
  }) => {
    await signIn(page, 'admin');
    let drawer = await openDrawer(page, STAFF, 'Quyền');
    await drawer.getByRole('switch', { name: 'Nhân viên' }).click();
    for (const label of STAFF_PERMISSIONS) await drawer.getByLabel(label).check();
    await expect(drawer.getByLabel('Mật khẩu của bạn').filter({ visible: true })).toHaveCount(0);
    await drawer.getByRole('button', { name: 'Lưu quyền' }).click();
    await expect(drawer.getByText('Đã lưu lúc')).toBeVisible();
    const staff = await getData<Access>(page, `/admin/users/${STAFF}/access`);
    expect(staff.isStaff).toBe(true);
    expect(staff.permissions).toEqual(
      expect.arrayContaining(['judge.change_profile', 'judge.ban_user', 'auth.change_user']),
    );

    drawer = await openDrawer(page, SUPER, 'Quyền');
    await drawer.getByRole('switch', { name: 'Superuser' }).click();
    await expect(drawer.getByLabel('Mật khẩu của bạn').filter({ visible: true })).toHaveCount(0);
    await drawer.getByRole('button', { name: 'Lưu quyền' }).click();
    await expect(drawer.getByText('Đã lưu lúc')).toBeVisible();
    expect((await getData<Access>(page, `/admin/users/${SUPER}/access`)).isSuperuser).toBe(true);
  });

  // The backend allows a few set-password calls per admin an hour: a rerun on the same stack needs its redis flushed.
  test("setting a password needs the admin's own password", async ({ page }) => {
    await signIn(page, 'admin');
    const drawer = await openDrawer(page, STAFF, 'Bảo mật');
    await drawer.getByLabel('Mật khẩu mới', { exact: true }).fill(STAFF_PASSWORD);
    await drawer.getByLabel('Nhập lại mật khẩu mới').fill(STAFF_PASSWORD);
    await drawer.getByLabel('Mật khẩu của bạn').fill('not my password');
    await drawer.getByRole('button', { name: 'Đặt mật khẩu', exact: true }).click();
    await expect(drawer.getByText('Mật khẩu của bạn không đúng.')).toBeVisible();
    await drawer.getByLabel('Mật khẩu của bạn').fill(ADMIN_PASSWORD);
    await drawer.getByRole('button', { name: 'Đặt mật khẩu', exact: true }).click();
    await expect(drawer.getByText('họ đã bị đăng xuất khỏi mọi phiên')).toBeVisible();
  });

  test('the account tab renames, deactivates and reactivates, bans and unbans', async ({
    page,
  }) => {
    await signIn(page, 'admin');
    let drawer = await openDrawer(page, PLAIN, 'Tài khoản');
    const renamed = `${PLAIN}_r`;
    await drawer.getByLabel('Tên đăng nhập').fill(renamed);
    await drawer.getByRole('button', { name: 'Đổi tên' }).click();
    await expect(page).toHaveURL(new RegExp(`user=${renamed}`));
    drawer = page.getByRole('dialog', { name: renamed });

    const confirm = page.getByRole('dialog', { name: `Vô hiệu hoá ${renamed}?` });
    // Escape closes only the confirm on top, never the drawer under it.
    await drawer.getByRole('button', { name: 'Vô hiệu hoá tài khoản' }).click();
    await expect(confirm).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(confirm).toBeHidden();
    await expect(drawer).toBeVisible();
    await drawer.getByRole('button', { name: 'Vô hiệu hoá tài khoản' }).click();
    await confirm.getByRole('button', { name: 'Vô hiệu hoá tài khoản' }).click();
    await expect(drawer.getByText('Chưa kích hoạt').first()).toBeVisible();
    await drawer.getByRole('button', { name: 'Kích hoạt tài khoản' }).click();
    await expect(drawer.getByRole('button', { name: 'Vô hiệu hoá tài khoản' })).toBeVisible();

    await drawer.getByLabel('Lý do (bắt buộc, hiện cho người bị cấm)').fill('U1 kiểm thử');
    await drawer.getByRole('button', { name: 'Cấm người dùng' }).click();
    await page
      .getByRole('dialog', { name: `Cấm ${renamed}?` })
      .getByRole('button', { name: 'Cấm', exact: true })
      .click();
    await expect(drawer.getByText('Lý do cấm: U1 kiểm thử')).toBeVisible();
    await drawer.getByRole('button', { name: 'Bỏ cấm' }).click();
    await expect(drawer.getByRole('button', { name: 'Cấm người dùng' })).toBeVisible();
  });

  test('a role made in the roles dialog is granted from the access tab', async ({ page }) => {
    await signIn(page, 'admin');
    const role = uniqueName('U1 role');
    await page.goto('/admin/users');
    await page.getByRole('button', { name: 'Vai trò', exact: true }).click();
    const roles = page.getByRole('dialog', { name: 'Vai trò' });
    await roles.getByRole('button', { name: 'Vai trò mới' }).click();
    await roles.getByLabel('Tên', { exact: true }).fill(role);
    await roles.getByLabel('Kiểm duyệt bình luận').check();
    await roles.getByRole('button', { name: 'Tạo vai trò' }).click();
    await expect(roles.getByText(role)).toBeVisible();
    await page.keyboard.press('Escape');

    const drawer = await openDrawer(page, SUPER_PLAIN(), 'Quyền');
    await drawer.getByRole('button', { name: role }).click();
    await expect(drawer.getByText(`qua ${role}`)).toBeVisible();
    await drawer.getByRole('button', { name: 'Lưu quyền' }).click();
    await expect(drawer.getByText('Đã lưu lúc')).toBeVisible();
    const access = await getData<{ groups: { name: string }[] }>(
      page,
      `/admin/users/${SUPER_PLAIN()}/access`,
    );
    expect(access.groups.map((group) => group.name)).toContain(role);
  });

  test('a new e-mail asks for the admin password; the reset link answers either way', async ({
    page,
  }) => {
    await signIn(page, 'admin');
    let drawer = await openDrawer(page, STAFF);
    await expect(drawer.getByLabel('Mật khẩu của bạn').filter({ visible: true })).toHaveCount(0);
    await drawer.getByLabel('Email').fill(`${STAFF}@example.com`);
    await drawer.getByLabel('Mật khẩu của bạn').filter({ visible: true }).fill(ADMIN_PASSWORD);
    await drawer.getByRole('button', { name: 'Lưu hồ sơ' }).click();
    await expect(drawer.getByText('Đã lưu lúc')).toBeVisible();
    const profile = await getData<{ email: string }>(page, `/admin/users/${STAFF}/profile`);
    expect(profile.email).toBe(`${STAFF}@example.com`);

    drawer = await openDrawer(page, STAFF, 'Bảo mật');
    await drawer.getByRole('button', { name: 'Gửi liên kết đặt lại mật khẩu' }).click();
    await expect(drawer.getByRole('status').or(drawer.getByRole('alert')).first()).toBeVisible();
  });

  test('a superuser views as a user from the danger zone and stops', async ({ page }) => {
    await signIn(page, 'admin');
    const drawer = await openDrawer(page, SUPER_PLAIN(), 'Tài khoản');
    await drawer.getByRole('button', { name: `Đóng vai ${SUPER_PLAIN()}` }).click();
    await page
      .getByRole('dialog', { name: `Đóng vai ${SUPER_PLAIN()}?` })
      .getByRole('button', { name: 'Bắt đầu đóng vai' })
      .click();
    const bar = page.getByRole('region', { name: 'Đang xem dưới tên người khác' });
    await expect(bar).toBeVisible();
    await bar.getByRole('button', { name: 'Dừng xem' }).click();
    await expect(bar).toBeHidden();
  });

  test('a staff member cannot open a superuser or themselves, and reads access without controls', async ({
    page,
  }) => {
    await page.goto('/login');
    await submitLoginForm(page, STAFF, STAFF_PASSWORD);
    await expect(page.getByRole('button', { name: `Tài khoản của ${STAFF}` })).toBeVisible();
    await page.goto('/admin/users');
    await expect(rowOf(page, 'e2e_admin')).toContainText('Khoá');
    await expect(rowOf(page, 'e2e_admin').getByTestId('user-edit-open')).toHaveCount(0);
    await page.goto(`/admin/users?user=${SUPER}`);
    await expect(page.getByTestId('user-edit-locked')).toContainText('Chỉ siêu quản trị');
    await expect(page.getByRole('dialog').getByRole('link', { name: 'Hồ sơ' })).toHaveCount(0);
    await page.goto(`/admin/users?user=${STAFF}`);
    await expect(page.getByTestId('user-edit-locked')).toContainText('tài khoản của bạn');

    const drawer = await openDrawer(page, 'e2e_user', 'Quyền');
    await expect(drawer.getByTestId('access-read-only')).toBeVisible();
    await expect(drawer.locator('input[type="checkbox"]')).toHaveCount(0);
    await expect(drawer.getByRole('button', { name: 'Lưu quyền' })).toHaveCount(0);
    await drawer.getByRole('link', { name: 'Hồ sơ', exact: true }).click();
    await expect(drawer.getByLabel('Họ và tên')).toBeEditable();
  });
});

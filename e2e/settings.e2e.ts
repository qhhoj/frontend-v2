import { expect, test } from './fixtures/api';
import { dataExportStatus } from '../src/test/fixtures';

test.beforeEach(({ api }) => void (api.signedIn = true));

test('profile: an over-long name is caught before sending, a fixed one is saved and survives a reload', async ({
  page,
  api,
}) => {
  await page.goto('/settings');
  const name = page.getByRole('textbox', { name: 'Tên hiển thị' });
  await name.fill('Trần Minh Thư (lớp 11A1, chuyên Tin, THPT Lê Hồng Phong)');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  const summary = page.locator('#main').getByRole('alert');
  await expect(summary).toContainText('Có 1 mục cần sửa: Tên hiển thị');
  await expect(summary).toBeFocused();
  expect(api.requestsTo('PATCH /profile')).toHaveLength(0);
  await summary.getByRole('link', { name: /Tên hiển thị tối đa/ }).click();
  await expect(name).toBeFocused();
  await name.fill('Trần Minh Thư');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.locator('#main').getByRole('status')).toHaveText(/^Đã lưu lúc \d\d:\d\d$/);
  await page.reload();
  await expect(page.getByLabel('Tên hiển thị')).toHaveValue('Trần Minh Thư');
});

test('security: turn on the authenticator app by keyboard, keep the codes, then turn it off with a backup code', async ({
  page,
}) => {
  await page.goto('/settings/security');
  await page.getByRole('button', { name: 'Bật', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bước 1 · Xác nhận mật khẩu' })).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.type('mật khẩu');
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('img', { name: 'Mã QR để thêm tài khoản vào ứng dụng xác thực' }),
  ).toBeVisible();
  await expect(page.getByText('JBSW Y3DP EHPK 3PXP')).toBeVisible();
  await page
    .getByRole('group', { name: 'Mã xác nhận' })
    .getByRole('textbox')
    .first()
    .fill('123456');
  await expect(page.getByText('K7QM-2XRA-9PTD-4WLE')).toBeVisible();
  await page.getByLabel('Tôi đã lưu các mã này ở nơi an toàn').check();
  await page.getByRole('button', { name: 'Xong' }).click();
  await expect(page.getByText('K7QM-2XRA-9PTD-4WLE')).toHaveCount(0);
  await page.getByRole('button', { name: 'Tắt', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Tắt xác thực hai bước?' });
  await dialog.getByRole('button', { name: 'Hoặc nhập một mã dự phòng' }).click();
  await dialog.getByLabel('Mã dự phòng').fill('k7qm-2xra 9ptd-4wle');
  await dialog.getByRole('button', { name: 'Tắt xác thực' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Bật', exact: true })).toBeVisible();
});

test('sign out everywhere lands on the sign-in page', async ({ page }) => {
  await page.goto('/settings/security');
  await page.getByRole('button', { name: 'Đăng xuất mọi nơi' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Đăng xuất mọi nơi' }).click();
  await expect(page).toHaveURL(/\/login/);
});

test('data: a request polls until the file is ready, then offers the download and stops polling', async ({
  page,
  api,
}) => {
  await page.goto('/settings/data');
  await page.getByRole('button', { name: 'Yêu cầu xuất dữ liệu' }).click();
  await expect(page.getByRole('button', { name: 'Đang chuẩn bị…' })).toBeVisible();
  const now = Date.now();
  api.dataExport = dataExportStatus({
    state: 'ready',
    preparedAt: new Date(now).toISOString(),
    readyAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 7 * 86_400_000).toISOString(),
    size: 1_048_576,
    nextPrepareAt: new Date(now + 86_400_000).toISOString(),
    canPrepare: false,
  });
  await expect(page.getByRole('link', { name: 'Tải về' })).toHaveAttribute('download', '', {
    timeout: 10_000,
  });
  const polls = api.requestsTo('GET /profile/data').length;
  await page.waitForTimeout(6000);
  expect(api.requestsTo('GET /profile/data')).toHaveLength(polls);
});

test('impersonation: the banner stays on top while scrolling and "Dừng xem" ends it', async ({
  page,
  api,
}) => {
  api.impersonatorId = 'staff-1';
  await page.goto('/settings/security');
  const banner = page.getByRole('region', { name: 'Đang xem dưới tên người khác' });
  await page.mouse.wheel(0, 1200);
  expect((await banner.boundingBox())!.y).toBe(0);
  await expect(page.getByRole('button', { name: 'Tạo token mới' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Đăng xuất mọi nơi' })).toBeDisabled();
  await page
    .getByRole('navigation', { name: 'Các mục cài đặt' })
    .getByRole('link', { name: 'Dữ liệu' })
    .click();
  await expect(page.getByText('Chỉ chủ tài khoản xuất được dữ liệu cá nhân.')).toBeVisible();
  await banner.getByRole('button', { name: 'Dừng xem' }).click(); // from any page, here the data page
  await expect(banner).toBeHidden();
});

test('security keys: a virtual authenticator registers a key that then lists', async ({
  page,
  api,
  context,
}, testInfo) => {
  api.routes['POST /auth/2fa/webauthn/register/options'] = {
    body: {
      data: {
        rp: { name: 'QHHOJ', id: 'localhost' },
        user: { id: 'dXNlcl8wMQ', name: 'user_01', displayName: 'user_01' },
        challenge: 'Y2hhbGxlbmdlLWNoYWxsZW5nZQ',
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        authenticatorSelection: { userVerification: 'preferred' },
        attestation: 'none',
      },
    },
  };
  const cdp = await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'usb',
      hasResidentKey: false,
      hasUserVerification: true,
      isUserVerified: true,
    },
  });
  // WebAuthn refuses an IP address as the relying-party host: the page is opened as `localhost` on the same server.
  const { port } = new URL(String(testInfo.project.use.baseURL));
  await page.goto(`http://localhost:${port}/settings/security`);
  await page.getByRole('button', { name: 'Thêm khóa' }).click();
  const form = page.locator('form[data-step="add-key"]');
  await form.getByLabel('Tên khóa').fill('YubiKey 5C');
  await form.getByLabel('Mật khẩu hiện tại').fill('mật khẩu');
  await page.getByRole('button', { name: 'Đăng ký khóa' }).click();
  await expect(page.locator('#main').getByRole('status')).toHaveText('Đã thêm khóa YubiKey 5C.');
  await expect(page.getByRole('button', { name: 'Xóa YubiKey 5C' })).toBeVisible();
});

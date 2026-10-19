import { generateKeyPairSync } from 'node:crypto';
import type { Page } from '@playwright/test';
import { CPP17_ID, organizationItem } from '../src/test/fixtures';
import { expect, test } from './fixtures/api';
import { PASSKEY_CREDENTIAL_ID, fail, installAuth } from './fixtures/auth';
import type { AuthScenario } from './fixtures/auth';

const SIGN_IN = { name: 'Đăng nhập', exact: true } as const;
const PASSWORD = { exact: true } as const;
const requestsOf = (scenario: AuthScenario, key: string) =>
  scenario.sent.filter((request) => request.key === key).map((request) => request.body);
/** The page's own status or alert, never the shell's always-present loading region. */
const statusOf = (page: Page) => page.locator('#main').getByRole('status');
const alertOf = (page: Page) => page.locator('#main').getByRole('alert');
const digit = (page: Page, position: number) =>
  page.getByLabel(`Chữ số ${position}`, { exact: true });

async function fillRegistration(page: Page, username: string) {
  await page.getByLabel('Tên đăng nhập').fill(username);
  await page.getByLabel('Email').fill('new@example.com');
  await page.getByLabel('Mật khẩu', PASSWORD).fill('correct horse battery');
  await page.getByLabel('Nhập lại mật khẩu', PASSWORD).fill('correct horse battery');
  await page.getByLabel('Tôi đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư.').check();
}

test.describe('password sign-in', () => {
  test('announces a wrong password once, keeps the name, and returns to the protected page', async ({
    page,
    api,
  }) => {
    installAuth(api);
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login\?redirect=\/settings/);
    await page.getByLabel('Tên đăng nhập').fill('user_01');
    await page.getByLabel('Mật khẩu', PASSWORD).fill('wrong');
    await page.getByRole('button', SIGN_IN).click();
    await expect(alertOf(page)).toHaveText('Sai tên đăng nhập hoặc mật khẩu.');
    await expect(page.getByLabel('Tên đăng nhập')).toHaveValue('user_01');
    await page.getByLabel('Mật khẩu', PASSWORD).fill('correct horse');
    await page.getByRole('button', SIGN_IN).click();
    await expect(page).toHaveURL(/\/settings$/);
  });

  test('switching language translates the screen and keeps what was typed', async ({
    page,
    api,
  }) => {
    installAuth(api);
    await page.goto('/login');
    await page.getByLabel('Tên đăng nhập').fill('user_01');
    await page.getByRole('button', { name: 'Switch to English' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sign in');
    await expect(page.getByLabel('Username')).toHaveValue('user_01');
  });

  test('a social button leaves for the backend; an OAuth failure comes back as a message', async ({
    page,
    api,
  }) => {
    installAuth(api);
    await page.route('**/api/internal/auth/social/google/start', (route) =>
      route.fulfill({ status: 302, headers: { location: '/login?error=oauth_failed' } }),
    );
    await page.goto('/login');
    await page.getByRole('link', { name: 'Đăng nhập với Google' }).click();
    await expect(page).toHaveURL(/\/login\?error=oauth_failed$/);
    await expect(alertOf(page)).toHaveText('Đăng nhập bằng mạng xã hội không thành công.');
  });
});

test.describe('second factor', () => {
  test('a typed code advances box by box and signs in when complete', async ({ page, api }) => {
    const auth = installAuth(api, { afterLogin: 'partial' });
    await page.goto('/login?redirect=%2Fproblems');
    await page.getByLabel('Tên đăng nhập').fill('user_01');
    await page.getByLabel('Mật khẩu', PASSWORD).fill('correct horse');
    await page.getByRole('button', SIGN_IN).click();
    await expect(page).toHaveURL(/\/login\/2fa\?redirect=\/problems/);
    await expect(page.getByText('Đang đăng nhập với user_01')).toBeVisible();
    await digit(page, 1).click();
    await page.keyboard.type('481923');
    await expect(page).toHaveURL(/\/problems$/);
    expect(requestsOf(auth, 'totp')).toEqual([{ code: '481923' }]);
  });

  test('a viewer without a usable factor can sign out and use another account', async ({
    page,
    api,
  }) => {
    const auth = installAuth(api, { phase: 'partial' });
    await page.goto('/login/2fa');
    await page.getByRole('button', { name: 'Đăng xuất' }).first().click();
    await expect(page).toHaveURL(/\/login$/);
    expect(auth.phase).toBe('anonymous');
  });

  test('a security key answers the backend challenge through the browser WebAuthn API', async ({
    page,
    api,
    context,
  }, testInfo) => {
    const auth = installAuth(api, { phase: 'partial' });
    // WebAuthn refuses an IP address as the relying-party host: the page is opened as `localhost` (the fake API matches any host).
    const { port } = new URL(String(testInfo.project.use.baseURL));
    const cdp = await context.newCDPSession(page);
    await cdp.send('WebAuthn.enable');
    const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol: 'ctap2',
        transport: 'internal',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    });
    const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    await cdp.send('WebAuthn.addCredential', {
      authenticatorId,
      credential: {
        credentialId: PASSKEY_CREDENTIAL_ID.toString('base64'),
        isResidentCredential: true,
        rpId: 'localhost',
        privateKey: privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64'),
        userHandle: Buffer.from('user_01').toString('base64'),
        signCount: 0,
      },
    });
    await page.goto(`http://localhost:${port}/login/2fa`);
    await page.getByRole('button', { name: 'Dùng khóa bảo mật' }).click();
    await expect(page).toHaveURL(/\/$/);
    expect(requestsOf(auth, 'webauthn-verify')).toMatchObject([
      {
        response: {
          id: PASSKEY_CREDENTIAL_ID.toString('base64url'),
          type: 'public-key',
          response: { signature: expect.any(String), authenticatorData: expect.any(String) },
        },
      },
    ]);
  });
});

test.describe('registration, activation and resend', () => {
  test('marks a taken username, never blocks, and registers with the school and the C++17 default', async ({
    page,
    api,
  }) => {
    const auth = installAuth(api);
    // P-13: no language field; once the languages load the account starts at C++17 all the same.
    const languagesLoaded = page.waitForResponse(/\/problems\/meta/);
    await page.goto('/register');
    await languagesLoaded;
    const terms = page.locator('label:has(input[name="rules"])');
    await expect(terms).toContainText(
      'Tôi đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư.',
    );
    await expect(terms.locator('a')).toHaveCount(0);
    await fillRegistration(page, 'taken_name');
    await expect(page.getByText('Tên đã có người dùng')).toBeVisible();
    await expect(page.getByRole('meter', { name: 'Độ mạnh mật khẩu' })).toHaveAttribute(
      'aria-valuenow',
      '4',
    );
    await page.getByRole('combobox', { name: 'Trường (tùy chọn)' }).click();
    await page.getByPlaceholder('Gõ để tìm trường').fill('THPT A');
    await page.getByRole('option', { name: organizationItem().name }).click();
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    await expect(page.getByText('Tên đăng nhập đã được dùng.')).toBeVisible();
    await expect(page.getByLabel('Tên đăng nhập')).toBeFocused();
    await page.getByLabel('Tên đăng nhập').fill('new_user');
    await expect(page.getByText('Tên khả dụng')).toBeVisible();
    await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kiểm tra hộp thư');
    await expect(statusOf(page)).toContainText('n***@example.com');
    await expect(page.getByText('được giữ cho địa chỉ này trong 7 ngày')).toBeVisible();
    expect(requestsOf(auth, 'register').at(-1)).toEqual({
      username: 'new_user',
      email: 'new@example.com',
      password: 'correct horse battery',
      organizationId: organizationItem().id,
      languageId: CPP17_ID,
    });
  });

  test('activates from the mailed link; a reload shows success without sending the key again', async ({
    page,
    api,
  }) => {
    const auth = installAuth(api);
    await page.goto('/activate/key-1');
    await expect(statusOf(page)).toHaveText(
      'Email của bạn đã được xác nhận. Bạn có thể đăng nhập ngay.',
    );
    await expect(page).toHaveURL(/\/activate\/done$/);
    await page.reload();
    await expect(statusOf(page)).toHaveText(
      'Email của bạn đã được xác nhận. Bạn có thể đăng nhập ngay.',
    );
    expect(requestsOf(auth, 'activate')).toEqual([{ token: 'key-1' }]);
  });

  test('the activation request carries no Referer with the key', async ({ page, api }) => {
    installAuth(api);
    await page.goto('/activate/key-1');
    await expect(statusOf(page)).toBeVisible();
    const activation = api.requestsTo('POST /auth/activate')[0];
    expect(activation.headers.referer).toBeUndefined();
  });

  test('a dead activation link offers a new one', async ({ page, api }) => {
    const auth = installAuth(api);
    api.routes['POST /auth/activate'] = fail(400, 'invalid_token');
    await page.goto('/activate/expired');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Liên kết đã hết hạn');
    await page.getByLabel('Email').fill('user_01@example.com');
    await page.getByRole('button', { name: 'Gửi lại liên kết' }).click();
    await expect(statusOf(page)).toContainText('u***@example.com');
    expect(requestsOf(auth, 'resend')).toEqual([{ email: 'user_01@example.com' }]);
  });

  test('a viewer whose account is not activated reaches the resend page from the login alert', async ({
    page,
    api,
  }) => {
    installAuth(api);
    api.routes['POST /auth/login'] = fail(403, 'account_not_activated');
    await page.goto('/login');
    await page.getByLabel('Tên đăng nhập').fill('user_01');
    await page.getByLabel('Mật khẩu', PASSWORD).fill('x');
    await page.getByRole('button', SIGN_IN).click();
    await alertOf(page).getByRole('link', { name: 'Gửi lại email kích hoạt' }).click();
    await expect(page).toHaveURL(/\/activate$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Gửi lại email kích hoạt');
  });

  test('finishes a social signup from the callback link, with the school chosen', async ({
    page,
    api,
  }) => {
    const auth = installAuth(api);
    const languagesLoaded = page.waitForResponse(/\/problems\/meta/);
    await page.goto('/register/social?token=pending-1');
    await languagesLoaded;
    await page.getByLabel('Tên đăng nhập').fill('social_user');
    await page.getByLabel('Mật khẩu', PASSWORD).fill('correct horse battery');
    await page.getByRole('combobox', { name: 'Trường (tùy chọn)' }).click();
    await page.getByRole('option', { name: organizationItem().name }).click();
    await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
    await expect(page).toHaveURL(/\/$/);
    expect(requestsOf(auth, 'social-complete')).toEqual([
      {
        token: 'pending-1',
        username: 'social_user',
        password: 'correct horse battery',
        organizationId: organizationItem().id,
        languageId: CPP17_ID,
      },
    ]);
  });
});

test.describe('passwords', () => {
  test('asks for a reset link, then sets a new password from the mailed link and lands on sign-in', async ({
    page,
    api,
  }) => {
    const auth = installAuth(api);
    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill('user_01@example.com');
    await page.getByRole('button', { name: 'Gửi liên kết' }).click();
    await expect(statusOf(page)).toContainText('u***@example.com');
    await page.goto('/reset-password/tok-1');
    await page.getByLabel('Mật khẩu mới', PASSWORD).fill('brand new passphrase');
    await page.getByLabel('Nhập lại mật khẩu', PASSWORD).fill('brand new passphrasX');
    await expect(page.getByText('Hai mật khẩu chưa khớp')).toBeVisible();
    await page.getByLabel('Nhập lại mật khẩu', PASSWORD).fill('brand new passphrase');
    await page.getByRole('button', { name: 'Đổi mật khẩu' }).click();
    await expect(page).toHaveURL(/\/login\?notice=password-reset$/);
    await expect(statusOf(page)).toHaveText('Mật khẩu đã được đổi, hãy đăng nhập lại.');
    expect(requestsOf(auth, 'reset')).toEqual([
      { token: 'tok-1', newPassword: 'brand new passphrase' },
    ]);
  });

  test('a breached password forces a change before anything else, then returns', async ({
    page,
    api,
  }) => {
    const auth = installAuth(api, { afterLogin: 'forced' });
    await page.goto('/login?redirect=%2Fproblems');
    await page.getByLabel('Tên đăng nhập').fill('user_01');
    await page.getByLabel('Mật khẩu', PASSWORD).fill('correct horse');
    await page.getByRole('button', SIGN_IN).click();
    await expect(page).toHaveURL(/\/account\/password\?redirect=\/problems/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Đổi mật khẩu để tiếp tục');
    await page.getByLabel('Mật khẩu hiện tại', PASSWORD).fill('correct horse');
    await page.getByLabel('Mật khẩu mới', PASSWORD).fill('brand new passphrase');
    await page.getByLabel('Nhập lại mật khẩu mới', PASSWORD).fill('brand new passphrase');
    await page.getByRole('button', { name: 'Đổi mật khẩu' }).click();
    await expect(page).toHaveURL(/\/problems$/);
    expect(requestsOf(auth, 'change')).toEqual([
      { currentPassword: 'correct horse', newPassword: 'brand new passphrase' },
    ]);
  });
});

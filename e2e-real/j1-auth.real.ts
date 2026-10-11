import { expect, test } from '@playwright/test';
import { API, CREDENTIALS, getData, signIn, signOut, submitLoginForm } from './support';

test.describe('J1 authentication', () => {
  test('sign in, stay signed in across a reload, sign out', async ({ page }) => {
    await signIn(page);
    await page.reload();
    await expect(
      page.getByRole('button', { name: `Tài khoản của ${CREDENTIALS.user.username}` }),
    ).toBeVisible();
    const me = await getData<{ user: { username: string } }>(page, '/auth/me');
    expect(me.user.username).toBe(CREDENTIALS.user.username);

    await signOut(page);
    const after = await page.request.get(`${API}/auth/me`);
    expect(after.status()).toBe(401);
  });

  test('a wrong password is refused and the user stays signed out', async ({ page }) => {
    await page.goto('/login');
    await submitLoginForm(page, CREDENTIALS.user.username, 'definitely-not-the-password');
    await expect(page.getByText('Sai tên đăng nhập hoặc mật khẩu.')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: /Tài khoản của/ })).toHaveCount(0);
  });
});

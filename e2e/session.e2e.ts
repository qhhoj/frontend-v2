import { expect, test } from './fixtures/api';

test('signing in from a protected page returns there; signing out leaves it', async ({
  page,
  api,
}) => {
  void api;
  await page.goto('/settings');
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await page.getByLabel('Tên đăng nhập').fill('user_01');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('correct horse');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await page.getByRole('button', { name: 'Tài khoản của user_01' }).click();
  await page.getByRole('menuitem', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('banner').getByRole('link', { name: 'Đăng nhập' })).toBeVisible();
});

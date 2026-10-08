import { expect, test } from './fixtures/api';

test('a theme choice applies at once and survives a reload', async ({ page, api }) => {
  void api;
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/blog');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'clay-dark');
  await page.getByRole('button', { name: 'Đổi giao diện' }).click();
  await page.getByRole('menuitem', { name: 'Glass sáng' }).click();
  await expect(html).toHaveAttribute('data-theme', 'glass-light');
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'glass-light');
});

test('auto follows the system colour scheme live, on Clay', async ({ page, api }) => {
  void api;
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/blog');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'clay-light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(html).toHaveAttribute('data-theme', 'clay-dark');
});

test('Glass automatic follows the system colour scheme live, on Glass, and survives a reload', async ({
  page,
  api,
}) => {
  void api;
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/blog');
  const html = page.locator('html');
  await page.getByRole('button', { name: 'Đổi giao diện' }).click();
  await page.getByRole('menuitem', { name: 'Glass tự động' }).click();
  await expect(html).toHaveAttribute('data-theme', 'glass-light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(html).toHaveAttribute('data-theme', 'glass-dark');
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'glass-dark');
});

test('a first visit without a colour-scheme preference is Clay light', async ({ page, api }) => {
  void api;
  await page.emulateMedia({ colorScheme: 'no-preference' });
  await page.goto('/blog');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'clay-light');
});

test('the remembered theme applies before any app script runs', async ({ page, api }) => {
  void api;
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/blog');
  await page.getByRole('button', { name: 'Đổi giao diện' }).click();
  await page.getByRole('menuitem', { name: 'Glass sáng' }).click();
  await page.route(/\/assets\/.*\.js$/, (route) => route.abort());
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'glass-light');
});

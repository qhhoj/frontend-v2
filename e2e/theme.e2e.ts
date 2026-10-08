import { expect, test } from './fixtures/api';

test('a theme choice applies at once and survives a reload', async ({ page, api }) => {
  void api;
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/blog');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'glass-dark');
  await page.getByRole('button', { name: 'Đổi giao diện' }).click();
  await page.getByRole('menuitem', { name: 'Glass sáng' }).click();
  await expect(html).toHaveAttribute('data-theme', 'glass-light');
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'glass-light');
});

test('auto follows the system colour scheme live', async ({ page, api }) => {
  void api;
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/blog');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'glass-light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(html).toHaveAttribute('data-theme', 'glass-dark');
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

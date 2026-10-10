import { expect, test } from './fixtures/api';

test('an anonymous viewer browses and filters problems, and the filter survives a reload', async ({
  page,
  api,
}) => {
  void api;
  await page.goto('/problems');
  await expect(page.getByRole('heading', { name: 'Bài tập', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Đường đi ngắn nhất', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Dạng bài' }).click();
  await page.getByRole('checkbox', { name: 'Quy hoạch động' }).check();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/type=/);
  await expect(page.getByRole('link', { name: 'Đường đi ngắn nhất', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Bỏ lọc: Quy hoạch động' })).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Điều hướng chính' });
  await expect(nav.getByRole('link', { name: 'Bài tập' })).toHaveAttribute('aria-current', 'page');
});

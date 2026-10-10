import { expect, test } from './fixtures/api';

test('the More menu is a menu button: expanded state, arrow keys, Escape, and it navigates', async ({
  page,
  api,
}) => {
  void api;
  await page.setViewportSize({ width: 768, height: 800 });
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Thêm', exact: true });
  await expect(button).toHaveAttribute('aria-haspopup', 'menu');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  const items = page.getByRole('menuitem');
  const count = await items.count();
  expect(count).toBeGreaterThan(0);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await expect(items).toHaveCount(0);
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toBeFocused();
  await button.click();
  await items.last().click();
  await expect(page).toHaveURL(/\/(organizations|blog|users)$/);
});

import { THEMES } from '../src/theme/registry';
import { expect, test } from './fixtures/api';

test('the theme menu opens with Enter, moves with arrows, closes with Escape and returns focus', async ({
  page,
  api,
}) => {
  void api;
  await page.goto('/blog');
  const trigger = page.getByRole('button', { name: 'Đổi giao diện' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(menu).toHaveAttribute('aria-activedescendant', /.+/);
  const first = await menu.getAttribute('aria-activedescendant');
  await page.keyboard.press('ArrowDown');
  expect(await menu.getAttribute('aria-activedescendant')).not.toBe(first);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('choosing a theme item with the keyboard applies it and returns focus to the button', async ({
  page,
  api,
}) => {
  void api;
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/blog');
  const trigger = page.getByRole('button', { name: 'Đổi giao diện' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menu')).toBeFocused();
  // The menu lists the Clay themes first, in registry order; the first ArrowDown enters it, each next one steps.
  const target = THEMES.find((theme) => theme.scheme === 'light')!; // Clay light
  for (let step = 0; step < THEMES.indexOf(target) + 1; step += 1)
    await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', target.id);
  await expect(page.getByRole('menu')).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('the account menu works from the keyboard and Escape returns focus', async ({ page, api }) => {
  api.signedIn = true;
  await page.goto('/blog');
  const trigger = page.getByRole('button', { name: 'Tài khoản của user_01' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu');
  await expect(menu).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Cài đặt' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('the points popover takes focus on open and gives it back on Escape', async ({
  page,
  api,
}) => {
  void api;
  await page.goto('/problems');
  const trigger = page.getByRole('button', { name: /^Lọc theo điểm/ });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const popover = page.getByRole('dialog');
  await expect(popover).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(popover.getByRole('spinbutton').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(popover).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

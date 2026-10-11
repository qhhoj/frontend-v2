import type { Page } from '@playwright/test';
import { profile } from '../src/test/fixtures';
import type { AccentId, Appearance } from '../src/theme/appearance';
import { THEMES } from '../src/theme/registry';
import { expect, test } from './fixtures/api';
import { applyTheme } from './fixtures/audit';
import { expectSameColour, readGlass } from './fixtures/glass-probe';

const TRIGGER = { name: 'Giao diện', exact: true } as const;
const READY = 'Dùng giao diện riêng';
const themeNamed = (id: string) => THEMES.find((theme) => theme.id === id)!;
/** The worst case for contrast: the most see-through glass and the strongest blobs. */
const worstLook = (accent: AccentId): Appearance => ({ accent, glass: 0, glow: 100 });
/** Starts every page of the test with this look remembered in the browser (and painted by the pre-paint script). */
const rememberLook = (page: Page, look: Appearance) =>
  page.addInitScript((stored) => {
    localStorage.setItem('qhhoj.appearance', stored);
    localStorage.setItem('qhhoj.paintedAppearance', stored);
  }, JSON.stringify(look));

const openPanel = async (page: Page) => {
  await page.getByRole('button', TRIGGER).click();
  const panel = page.getByRole('dialog', { name: 'Giao diện' });
  await expect(panel).toBeVisible();
  return panel;
};

test('an anonymous visitor picks a look in the panel; it survives a reload and needs no account', async ({
  page,
  api,
}) => {
  // Glass and Glow only act on a Glass theme, so this flow starts on one.
  await applyTheme(page, api, themeNamed('glass-dark'));
  await page.goto('/blog');
  const panel = await openPanel(page);
  await panel.getByRole('button', { name: 'Sunset' }).click();
  await panel.getByRole('button', { name: 'Đặc' }).click();
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-accent', 'sunset');
  await expect(panel.getByRole('button', { name: 'Sunset' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(panel.getByRole('button', { name: 'Đặc' })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(html).toHaveAttribute('data-accent', 'sunset');
  const look = await readGlass(page);
  expectSameColour(look.fill, look.solid);
  expect(look.blur).toBe('blur(0px)');
  expect(api.requestsTo('PATCH /profile')).toEqual([]);
});

test('the panel and the settings page show the same look, and the page takes focus', async ({
  page,
  api,
}) => {
  void api;
  await page.goto('/blog');
  const panel = await openPanel(page);
  await panel.getByRole('button', { name: 'Mint' }).click();
  await panel.getByRole('link', { name: 'Thêm trong Cài đặt' }).click();
  await expect(page).toHaveURL(/\/settings\/appearance$/);
  // The router focuses #main on a new page; closing the popover by a link must not pull focus back to the button.
  await expect(page.locator('#main')).toBeFocused();
  await expect(page.getByRole('switch', { name: READY })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Mint' })).toHaveAttribute('aria-pressed', 'true');
});

test('a signed-in look is read from the account and saved there', async ({ page, api }) => {
  api.signedIn = true;
  const saved: unknown[] = [];
  api.routes['GET /profile'] = {
    body: { data: profile({ appearance: { accent: 'ocean', glass: 40, glow: 60 } }) },
  };
  api.routes['PATCH /profile'] = ({ body }) => {
    saved.push(body);
    return { body: { data: profile(body as object) } };
  };
  await rememberLook(page, { accent: 'mint', glass: 0, glow: 100 });
  await page.goto('/blog');
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'ocean');
  const panel = await openPanel(page);
  await panel.getByRole('button', { name: 'Gold' }).click();
  await expect.poll(() => saved).toEqual([{ appearance: { accent: 'gold', glass: 40, glow: 60 } }]);
});

test('a device that asks for less transparency gets solid cards whatever the slider says', async ({
  page,
  api,
}) => {
  void api;
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  });
  // Not applyTheme: its emulateMedia call could replace the CDP media features, so the anonymous browser preference picks the Glass theme.
  await page.addInitScript(() => localStorage.setItem('qhhoj.theme', 'glass-dark'));
  await rememberLook(page, worstLook('orchid'));
  await page.goto('/settings/appearance');
  const supported = await page.evaluate(
    () => matchMedia('(prefers-reduced-transparency: reduce)').matches,
  );
  test.skip(!supported, 'this Chromium build does not know prefers-reduced-transparency');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'glass-dark');
  await expect(page.getByText(READY, { exact: true })).toBeVisible();
  const look = await readGlass(page);
  expectSameColour(look.fill, look.solid);
  expect(look.blur).toBe('blur(0px)');
  await expect(page.locator('#glass-level')).toBeDisabled();
  await expect(page.getByText('Thiết bị của bạn yêu cầu giảm độ trong suốt')).toBeVisible();
});

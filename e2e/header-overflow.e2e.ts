import type { Page } from '@playwright/test';
import { sessionResponse, sessionUser } from '../src/test/fixtures';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { ok } from './fixtures/reply';

const WIDTHS = [320, 375, 768, 1024, 1280, 1440, 1920];
const LOCALES = [
  { locale: 'vi', nav: 'Điều hướng chính', more: 'Thêm', current: 'Tổ chức' },
  { locale: 'en', nav: 'Main navigation', more: 'More', current: 'Organizations' },
] as const;
const STATES = ['signed out', 'signed in, 30-char username', 'official mode pill'] as const;
type State = (typeof STATES)[number];
const LONG_USERNAME = 'a_very_long_username_of_30_ch';
const MD = 768;

const setUp = async (page: Page, api: FakeApi, locale: string, state: State) => {
  await page.addInitScript((value) => localStorage.setItem('qhhoj.locale', value), locale);
  if (state === 'signed in, 30-char username') {
    api.signedIn = true;
    api.routes['GET /auth/me'] = ok(
      sessionResponse({ user: sessionUser({ username: LONG_USERNAME }) }),
    );
  }
  if (state === 'official mode pill')
    api.routes['GET /site'] = ok({
      navigation: [],
      config: {},
      officialMode: true,
      officialModeEndsAt: '2099-01-01T00:00:00Z',
    });
};

const horizontalPageScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** The header's first row holds the brand, the nav and the tools at the same height. */
const expectOneRow = async (page: Page, navName: string) => {
  const header = (await page.getByRole('banner').boundingBox())!;
  const brand = (await page.getByRole('link', { name: 'QHHOJ' }).first().boundingBox())!;
  const nav = (await page.getByRole('navigation', { name: navName }).boundingBox())!;
  const locale = (await page.getByRole('button', { name: /Chuyển sang|Switch to/ }).boundingBox())!;
  const centre = (box: { y: number; height: number }) => box.y + box.height / 2;
  for (const box of [brand, nav, locale]) expect(centre(box)).toBeCloseTo(centre(nav), 0);
  expect(header.height, 'one row: the nav pill (52) plus the vertical padding').toBeLessThan(90);
};

const navLinks = (page: Page, navName: string) =>
  page.getByRole('navigation', { name: navName }).getByRole('link');

/** Names of the links in the bar and of the items in the open More menu. */
const barAndMenu = async (page: Page, navName: string, more: string) => {
  const bar = await navLinks(page, navName).allInnerTexts();
  const button = page.getByRole('button', { name: more, exact: true });
  const hasMenu = (await button.count()) > 0;
  if (!hasMenu) return { bar, menu: [] as string[] };
  await button.click();
  const menu = await page.getByRole('menuitem').allInnerTexts();
  await page.keyboard.press('Escape');
  return { bar, menu };
};

for (const { locale, nav, more, current } of LOCALES)
  for (const state of STATES)
    for (const width of WIDTHS)
      test(`${locale}, ${state}, ${width} px: one header row, no sideways scroll, current item whole`, async ({
        page,
        api,
      }) => {
        await setUp(page, api, locale, state);
        await page.setViewportSize({ width, height: 800 });
        await page.goto('/organizations');
        const pill = page.getByRole('navigation', { name: nav });
        await expect(pill).toBeVisible();
        expect(await horizontalPageScroll(page)).toBeLessThanOrEqual(0);
        if (state === 'signed in, 30-char username') {
          const account = (await page
            .getByRole('button', { name: /Tài khoản|Account/ })
            .boundingBox())!;
          expect(account.x + account.width).toBeLessThanOrEqual(width);
        }
        const currentLink = pill.getByRole('link', { name: current });
        await expect(currentLink).toBeVisible();
        const box = (await currentLink.boundingBox())!;
        const frame = (await pill.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(frame.x);
        expect(box.x + box.width).toBeLessThanOrEqual(frame.x + frame.width + 1);
        if (width < MD) {
          const atEnd = await pill.evaluate(
            (el) => el.scrollLeft >= el.scrollWidth - el.clientWidth - 1,
          );
          const clearance = atEnd ? 0 : 24;
          expect(box.x + box.width, 'clear of the fade band').toBeLessThanOrEqual(
            frame.x + frame.width - clearance + 1,
          );
          return;
        }
        await expectOneRow(page, nav);
        const { bar, menu } = await barAndMenu(page, nav, more);
        const all = (await navLinks(page, nav).count()) + menu.length;
        expect(all, 'every item is in the bar or in the menu').toBe(7);
        expect(bar).toContain(current);
        expect(menu.filter((name) => bar.includes(name))).toEqual([]);
      });

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

test('the bar re-fits when the locale changes without a window resize', async ({ page, api }) => {
  void api;
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto('/organizations');
  const vi = await barAndMenu(page, 'Điều hướng chính', 'Thêm');
  await page.getByRole('button', { name: /English/ }).click();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  const en = await barAndMenu(page, 'Main navigation', 'More');
  expect(en.bar.length + en.menu.length).toBe(7);
  expect(en.bar.length).toBeLessThanOrEqual(vi.bar.length);
  await expectOneRow(page, 'Main navigation');
});

test('the phone strip fades where items are clipped and the fade goes at md', async ({
  page,
  api,
}) => {
  void api;
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  const pill = page.getByRole('navigation', { name: 'Điều hướng chính' });
  await expect.poll(() => pill.evaluate((el) => el.style.maskImage)).toContain('transparent 100%');
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect.poll(() => pill.evaluate((el) => el.style.maskImage)).toBe('');
});

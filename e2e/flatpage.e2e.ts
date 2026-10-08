import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { flatpage } from '../src/test/community-fixtures';
import { THEMES } from '../src/theme/registry';
import { expect, test } from './fixtures/api';
import { ok } from './fixtures/reply';

const PAGE = '/about/rules';
const MEMBERS_ONLY = '/doi-tuyen';
const UNKNOWN = '/khong/co';
const UNAUTHORIZED = {
  status: 401,
  body: { error: { code: 'unauthorized', message: 'Unauthorized' } },
};
const NOT_FOUND = { status: 404, body: { error: { code: 'not_found', message: 'Not found' } } };
// Nowrap cells: wrapping text would shrink the table to fit the box and never overflow.
const WIDE_TABLE = `<table><tr>${'<td style="white-space:nowrap">Bảng rất rộng</td>'.repeat(14)}</tr></table>`;

const noPageScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test('a stored page renders with its breadcrumb and title', async ({ page, api }) => {
  api.signedIn = false;
  await page.goto(PAGE);
  await expect(page.getByRole('heading', { level: 1, name: 'Quy tắc cộng đồng' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Đường dẫn' })).toContainText('Trang chủ');
});

test('a members-only page asks a signed-out reader to sign in and comes back to it', async ({
  page,
  api,
}) => {
  api.routes[`GET /pages${MEMBERS_ONLY}`] = UNAUTHORIZED;
  await page.goto(MEMBERS_ONLY);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Đăng nhập để đọc trang này' }),
  ).toBeVisible();
  const signIn = page.getByRole('main').getByRole('link', { name: 'Đăng nhập' });
  await expect(signIn).toHaveAttribute('href', `/login?redirect=${MEMBERS_ONLY}`);
  await signIn.click();
  await expect(page).toHaveURL(/\/login\?redirect=/);
});

test('an unknown path shows the 404 page with the requested path', async ({ page, api }) => {
  api.routes[`GET /pages${UNKNOWN}`] = NOT_FOUND;
  await page.goto(UNKNOWN);
  await expect(page.getByRole('heading', { level: 1, name: 'Không tìm thấy trang' })).toBeVisible();
  await expect(page.getByTestId('requested-path')).toHaveText(UNKNOWN);
});

test('a wide table in a stored page scrolls inside its box on a phone', async ({ page, api }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  api.routes[`GET /pages${PAGE}`] = ok(flatpage({ contentHtml: WIDE_TABLE }));
  await page.goto(PAGE);
  // user-content makes each table a horizontal scroller (display block, overflow-x auto); the page never scrolls.
  const table = page.locator('.user-content table');
  await expect(table).toBeVisible();
  expect(await noPageScroll(page)).toBe(true);
  const overflows = await table.evaluate((element) => element.scrollWidth > element.clientWidth);
  expect(overflows).toBe(true);
  const movedBy = await table.evaluate((element) => {
    element.scrollLeft = 100;
    return element.scrollLeft;
  });
  expect(movedBy).toBeGreaterThan(0);
  expect(await noPageScroll(page)).toBe(true);
});

const STATES = [
  { name: 'page', path: PAGE, route: ok(flatpage()), heading: 'Quy tắc cộng đồng' },
  {
    name: 'sign-in state',
    path: MEMBERS_ONLY,
    route: UNAUTHORIZED,
    heading: 'Đăng nhập để đọc trang này',
  },
  { name: '404 page', path: UNKNOWN, route: NOT_FOUND, heading: 'Không tìm thấy trang' },
];

for (const theme of THEMES)
  for (const viewport of [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'phone 375 px', width: 375, height: 812 },
  ])
    for (const state of STATES)
      test(`the ${state.name} has no WCAG 2.1 A/AA violations and no horizontal scroll in ${theme.id}, ${viewport.name}`, async ({
        page,
        api,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.emulateMedia({ colorScheme: theme.scheme });
        await page.addInitScript((id) => localStorage.setItem('qhhoj.theme', id), theme.id);
        api.routes[`GET /pages${state.path}`] = state.route;
        await page.goto(state.path);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
        await expect(page.getByRole('heading', { level: 1, name: state.heading })).toBeVisible();
        const { violations } = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        expect(violations).toEqual([]);
        expect(await noPageScroll(page)).toBe(true);
      });

import { LEADERBOARD_PAGE_SIZE } from '../src/api/types/users';
import { leaderboardEntry } from '../src/test/fixtures';
import { SKELETON_ROW_COUNT } from '../src/features/leaderboard/leaderboard-cells';
import { THEMES } from '../src/theme/registry';
import { expect, list, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, applyTheme, axeViolationsIn } from './fixtures/audit';
import { defineShiftTests, PHONE_AND_DESKTOP } from './fixtures/layout-shift';

/** One full page of the board, as the query asks for it (`LEADERBOARD_PAGE_SIZE` rows). */
const fullPage = Array.from({ length: LEADERBOARD_PAGE_SIZE }, (_row, index) =>
  leaderboardEntry(index + 1, `user_${index + 10}`, 2900 - (index % 20) * 120),
);

test.beforeEach(({ api }) => {
  api.routes['GET /users'] = list(fullPage);
});

test('a signed-in viewer finds their rank and lands on their row', async ({ page, api }) => {
  api.signedIn = true;
  api.routes['GET /users'] = list([...fullPage, leaderboardEntry(15, 'user_01', 1487)]);
  await page.goto('/users');
  await page.getByRole('button', { name: 'Tìm hạng của tôi' }).click();
  await expect(page).toHaveURL(/page=12#user-user_01$/);
  await expect(page.locator('#user-user_01')).toBeInViewport();
});

test('the exact-username box opens that profile', async ({ page }) => {
  await page.goto('/users');
  await page.getByLabel('Tên đăng nhập').fill('khoa.tran');
  await page.getByRole('button', { name: 'Mở', exact: true }).click();
  await expect(page).toHaveURL('/users/khoa.tran');
});

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
    test(`the leaderboard has no WCAG A/AA violations and no page scroll in ${theme.id} at ${viewport.width}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      api.signedIn = true;
      await applyTheme(page, api, theme);
      await page.goto('/users');
      await expect(page.getByText('user_10', { exact: true })).toBeVisible();
      expect(await axeViolationsIn(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });

defineShiftTests([
  {
    name: 'leaderboard table',
    path: '/users',
    signedIn: false,
    hold: 'GET /users',
    answer: (api) => (api.routes['GET /users'] = list(fullPage.slice(0, SKELETON_ROW_COUNT))),
    parts: (page) => ({ table: page.locator('table') }),
    viewports: PHONE_AND_DESKTOP,
  },
]);

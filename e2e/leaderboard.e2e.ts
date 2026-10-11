import { LEADERBOARD_PAGE_SIZE } from '../src/api/types/users';
import { leaderboardEntry } from '../src/test/fixtures';
import { expect, list, test } from './fixtures/api';

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

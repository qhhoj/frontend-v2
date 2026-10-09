import { expect, test } from '@playwright/test';
import { CREDENTIALS, getData, signIn, uniqueName } from './support';

test.describe('J5 profile', () => {
  test('the profile shows the number of problems solved so far', async ({ page }) => {
    await signIn(page);
    const { username } = CREDENTIALS.user;
    const profilePath = `/users/${username}`;
    // The worker recomputes the count after grading, so it lags J3's accepted submission.
    await expect
      .poll(async () => (await getData<{ problemCount: number }>(page, profilePath)).problemCount, {
        timeout: 60_000,
      })
      .toBeGreaterThanOrEqual(1);
    const { problemCount } = await getData<{ problemCount: number }>(page, profilePath);
    await page.goto(profilePath);
    await expect(page.getByRole('heading', { level: 1, name: username })).toBeVisible();
    const tile = page
      .getByTestId('profile-stats')
      .locator('dl > div')
      .filter({ hasText: 'Bài đã giải' });
    await expect(tile.locator('dd').first()).toHaveText(String(problemCount));
  });

  // Editing the about text needs staff or five solved problems, so the admin edits.
  test('edited profile text survives a reload and shows on the public page', async ({ page }) => {
    await signIn(page, 'admin');
    const about = `smoke ${uniqueName('about')}`;
    await page.goto('/settings');
    await page.getByLabel('Giới thiệu bản thân', { exact: true }).fill(about);
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(page.getByText('Đã lưu hồ sơ.')).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Giới thiệu bản thân', { exact: true })).toHaveValue(about);
    await page.goto(`/users/${CREDENTIALS.admin.username}`);
    await expect(page.getByText(about)).toBeVisible();
  });
});

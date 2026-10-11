import { expect, test } from './fixtures/api';

const REPLAY = '/contests/r41/replay';

test('the replay plays the board to the end, keeps the second in the link and marks ghosts', async ({
  page,
  api,
}) => {
  api.signedIn = false;
  await page.goto(`${REPLAY}?t=600`);
  await expect(page.getByRole('heading', { name: 'QHH Round #41' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Phát lại' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.locator('tbody tr').first()).toHaveAttribute('data-row-id', 'ghost-0');
  await expect(page.locator('tr[data-kind="ghost"]').last()).toContainText('Không đủ dữ liệu');
  await page.getByLabel('Thời điểm phát lại').fill('10000');
  await expect(page).toHaveURL(/t=10000/);
  await page.getByRole('button', { name: 'x300' }).click();
  await page.getByRole('button', { name: 'Phát', exact: true }).click();
  const finished = page.locator('p:not(.sr-only)').filter({ hasText: 'Đã phát đến cuối.' });
  await expect(finished.getByTestId('inline-bit')).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveURL(/t=10800/);
});

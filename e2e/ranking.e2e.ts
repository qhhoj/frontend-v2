import { expect, test } from './fixtures/api';

test('the ranking shows the frozen board, the viewer and the virtual toggle', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  await page.goto('/contests/r42/ranking');
  await expect(page.getByRole('heading', { name: 'QHH Round #42 (Div. 2)' })).toBeVisible();
  await expect(page.getByText('Bảng đang đóng băng')).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'user_01' }).getByText('Bạn')).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'user_07' }).getByText('?2')).toBeVisible();
  await page.getByRole('button', { name: 'Gồm thi ảo' }).click();
  await expect(page).toHaveURL(/virtual=1/);
});

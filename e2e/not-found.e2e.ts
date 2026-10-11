import { expect, test } from './fixtures/api';

const UNKNOWN = '/no/such/page';

test('an unknown path shows the 404 page with two focusable links and the path', async ({
  page,
  api,
}) => {
  api.signedIn = false;
  await page.goto(UNKNOWN);
  await expect(page.getByRole('heading', { level: 1, name: 'Không tìm thấy trang' })).toBeVisible();
  await expect(page.getByTestId('requested-path')).toHaveText(UNKNOWN);
  for (const name of ['Về trang chủ', 'Xem danh sách bài']) {
    const link = page.getByRole('main').getByRole('link', { name });
    await link.focus();
    await expect(link).toBeFocused();
  }
  await page.getByRole('main').getByRole('link', { name: 'Về trang chủ' }).click();
  await expect(page).toHaveURL(/\/$/);
});

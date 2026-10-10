import { expect, test } from './fixtures/api';

test("a row's source link opens the submission with its source code in view", async ({
  page,
  api,
}) => {
  api.signedIn = true;
  await page.goto('/submissions');
  await page
    .getByRole('link', { name: /Xem mã nguồn/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/submissions\/sub-1#source$/);
  await expect(page.getByText('int main() {}')).toBeInViewport();
});

test('clicking a row away from its links opens the submission', async ({ page, api }) => {
  api.signedIn = true;
  await page.goto('/submissions');
  await page.locator('tbody tr[data-id="sub-1"] td').nth(2).click();
  await expect(page).toHaveURL(/\/submissions\/sub-1$/);
});

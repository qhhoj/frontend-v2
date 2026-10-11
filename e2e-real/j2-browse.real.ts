import { expect, test } from '@playwright/test';
import { getData } from './support';

test.describe('J2 browse problems', () => {
  test('the list shows both seeded problems and search narrows it', async ({ page }) => {
    await page.goto('/problems');
    await expect(page.getByRole('link', { name: 'A plus B', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Max of two', exact: true })).toBeVisible();

    await page.getByPlaceholder('Tìm theo mã hoặc tên bài').fill('e2e_max');
    await expect(page.getByText('e2e_max', { exact: true })).toBeVisible();
    await expect(page.getByText('e2e_sum', { exact: true })).toHaveCount(0);
  });

  test('a statement page shows the name and text the server stores', async ({ page }) => {
    const problem = await getData<{ name: string }>(page, '/problems/e2e_max');
    await page.goto('/problems/e2e_max');
    await expect(page.locator('#main h1')).toContainText(problem.name);
    await expect(page.getByText('Print the larger of two integers.')).toBeVisible();
  });
});

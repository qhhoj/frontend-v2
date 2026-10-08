import { expect, test } from './fixtures/api';

for (const width of [375, 1280])
  test(`the editorial opens from its tab at ${width} px and fits the screen`, async ({
    page,
    api,
  }) => {
    void api; // installs the fake API
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/problems/duongdi');
    await page.getByRole('tab', { name: 'Lời giải' }).click();
    await expect(page.locator('.user-content')).toContainText('Dùng Dijkstra.');
    await expect(page.getByTestId('editorial-meta')).toContainText('user_07');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

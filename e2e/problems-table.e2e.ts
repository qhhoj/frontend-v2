import { expect, test } from './fixtures/api';

const TABLET_WIDTHS = [640, 720, 800];
const DESKTOP_WIDTH = 1280;
const HEIGHT = 800;

for (const width of TABLET_WIDTHS)
  test(`at ${width} px a problem name keeps its room, and its types move under it`, async ({
    page,
    api,
  }) => {
    void api;
    await page.setViewportSize({ width, height: HEIGHT });
    await page.goto('/problems');
    const name = page.getByRole('link', { name: 'Dãy con tăng dài nhất' });
    await expect(name).toBeVisible();
    expect(await name.evaluate((link) => link.scrollWidth - link.clientWidth)).toBeLessThanOrEqual(
      0,
    );
    await expect(page.getByRole('columnheader', { name: 'Dạng bài' })).toBeHidden();
    await expect(page.getByRole('row', { name: /Dãy con tăng dài nhất/ })).toContainText(
      'lis · Quy hoạch động',
    );
  });

test('on a desktop the types are a column of their own', async ({ page, api }) => {
  void api;
  await page.setViewportSize({ width: DESKTOP_WIDTH, height: HEIGHT });
  await page.goto('/problems');
  await expect(page.getByRole('columnheader', { name: 'Dạng bài' })).toBeVisible();
  await expect(
    page
      .getByRole('row', { name: /Dãy con tăng dài nhất/ })
      .getByRole('cell')
      .nth(1),
  ).toHaveText('Quy hoạch động');
  await expect(page.getByText('· Quy hoạch động')).toBeHidden();
});

import type { Locator, Page } from '@playwright/test';
import { problemDetail, scratchLanguage } from '../src/test/fixtures';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';

const PHONE_WIDTHS = [390, 375, 360, 320];
const PHONE_HEIGHT = 812;
const MIN_TOUCH_TARGET_PX = 44;
/** Room for the language's name beside its token and chevron: a picker squeezed to its icon cannot be read or picked. */
const MIN_PICKER_WIDTH_PX = 120;
const LONG_STATEMENT = Array.from(
  { length: 40 },
  (_unused, line) => `<p>Dòng ${line + 1} của đề bài.</p>`,
).join('');

async function openProblem(
  page: Page,
  api: FakeApi,
  width: number,
  { signedIn = true, path = '/problems/duongdi' } = {},
) {
  api.signedIn = signedIn;
  api.routes['GET /problems/duongdi'] = {
    body: { data: problemDetail({ descriptionHtml: LONG_STATEMENT }) },
  };
  await page.setViewportSize({ width, height: PHONE_HEIGHT });
  await page.goto(path);
  await expect(page.locator('#main h1')).toBeVisible();
}
const collapsedBar = (page: Page) => page.getByRole('region', { name: 'Nộp bài' });
const sheetOf = (page: Page) => page.getByRole('dialog', { name: 'Nộp bài' });
const boxOf = async (locator: Locator) => (await locator.boundingBox())!;
async function expectTouchTarget(locator: Locator) {
  const box = await boxOf(locator);
  expect(box.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
  expect(box.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
}

for (const width of PHONE_WIDTHS)
  test.describe(`submit sheet at ${width} px`, () => {
    test('reserves only the collapsed bar and never hides the last statement line', async ({
      page,
      api,
    }) => {
      await openProblem(page, api, width);
      const bar = await boxOf(collapsedBar(page));
      expect(bar.y + bar.height).toBeCloseTo(PHONE_HEIGHT, 0);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const lastLine = await boxOf(page.locator('.statement p').last());
      expect(lastLine.y + lastLine.height).toBeLessThanOrEqual(bar.y);
      await expectTouchTarget(page.getByRole('button', { name: 'Mở rộng' }));
    });

    test('opens over the statement and always lets the viewer close it again', async ({
      page,
      api,
    }) => {
      await openProblem(page, api, width);
      await page.getByRole('button', { name: 'Mở rộng' }).click();
      const sheet = sheetOf(page);
      await expect(sheet.getByRole('heading', { name: 'Nộp bài' })).toBeFocused();
      const box = await boxOf(sheet);
      expect(box.height).toBeLessThanOrEqual(PHONE_HEIGHT * 0.85 + 1);
      expect(box.y + box.height).toBeCloseTo(PHONE_HEIGHT, 0);
      for (const control of [
        sheet.getByRole('button', { name: 'Thu gọn' }),
        sheet.getByRole('button', { name: 'Nộp bài' }),
        sheet.getByRole('combobox', { name: 'Ngôn ngữ' }),
        sheet.locator('label', { hasText: 'Tải tệp lên' }),
        sheet.getByTestId('runtimes-link'),
      ])
        await expectTouchTarget(control);
      await expect(sheet.getByRole('button', { name: 'Nộp bài' })).toBeInViewport();
      await page.keyboard.press('Escape');
      await expect(sheetOf(page)).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Mở rộng' })).toBeFocused();
    });

    test('gives the language picker usable width, with the runtimes link under the row', async ({
      page,
      api,
    }) => {
      await openProblem(page, api, width);
      await page.getByRole('button', { name: 'Mở rộng' }).click();
      const sheet = sheetOf(page);
      const picker = await boxOf(sheet.getByRole('combobox', { name: 'Ngôn ngữ' }));
      const upload = await boxOf(sheet.locator('label', { hasText: 'Tải tệp lên' }));
      const link = await boxOf(sheet.getByTestId('runtimes-link'));
      expect(picker.width).toBeGreaterThanOrEqual(MIN_PICKER_WIDTH_PX);
      expect(upload.x).toBeGreaterThan(picker.x + picker.width);
      expect(link.y).toBeGreaterThanOrEqual(
        Math.max(picker.y + picker.height, upload.y + upload.height),
      );
    });

    test('keeps the file-only state inside the sheet without sideways scroll', async ({
      page,
      api,
    }) => {
      await openProblem(page, api, width);
      await page.getByRole('button', { name: 'Mở rộng' }).click();
      await sheetOf(page).getByRole('combobox', { name: 'Ngôn ngữ' }).click();
      await page.getByRole('option', { name: new RegExp(scratchLanguage().name) }).click();
      await sheetOf(page)
        .locator('input[type="file"]')
        .setInputFiles({
          name: 'catmaze-final.sb3',
          mimeType: 'application/zip',
          buffer: Buffer.from('x'),
        });
      await expect(sheetOf(page).getByText('catmaze-final.sb3')).toBeVisible();
      await expectTouchTarget(sheetOf(page).getByRole('button', { name: 'Bỏ tệp' }));
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
      ).toBeLessThanOrEqual(0);
    });
  });

import type { Page } from '@playwright/test';
import { problemDetail, submissionDetail } from '../src/test/fixtures';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { openDock } from './fixtures/submit-dock';

const SHOTS_DIR = process.env.SHOTS_DIR;
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
];

async function openProblem(page: Page, api: FakeApi, size: { width: number; height: number }) {
  api.signedIn = true;
  api.routes['GET /problems/duongdi'] = { body: { data: problemDetail() } };
  await page.setViewportSize(size);
  await page.goto('/problems/duongdi');
  await expect(page.locator('#main h1')).toBeVisible();
}
/** A computer opens the dock from the rail card (P-02 B); a phone expands the sheet's bar. */
async function openSubmitPanel(page: Page, size: { name: string }) {
  if (size.name === '390') await page.getByRole('button', { name: 'Mở rộng' }).click();
  else await openDock(page);
}
const fullPanel = (page: Page) => page.locator('[role="dialog"][aria-modal="true"]');
const shot = async (page: Page, name: string) => {
  if (SHOTS_DIR) await page.screenshot({ path: `${SHOTS_DIR}/${name}.png` });
};
const hasHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

for (const size of VIEWPORTS)
  test.describe(`submit panel full screen at ${size.name} px`, () => {
    test('covers the viewport without horizontal scroll, and submits like the dock', async ({
      page,
      api,
    }) => {
      api.routes['GET /submissions/sub-9'] = { body: { data: submissionDetail({ id: 'sub-9' }) } };
      await openProblem(page, api, size);
      await openSubmitPanel(page, size);
      await shot(page, `docked-${size.name}`);
      await page.getByRole('button', { name: 'Toàn màn hình' }).click();
      await expect(fullPanel(page)).toBeVisible();
      const box = (await fullPanel(page).boundingBox())!;
      await shot(page, `fullscreen-${size.name}`);
      expect(box).toMatchObject({ x: 0, y: 0, width: size.width, height: size.height });
      expect(await hasHorizontalScroll(page)).toBe(false);
      const editor = fullPanel(page).locator('.cm-editor');
      expect((await editor.boundingBox())!.height).toBeGreaterThan(size.height / 2);

      await fullPanel(page).locator('.cm-content').click();
      await page.keyboard.type('int main() {}');
      await fullPanel(page).getByRole('button', { name: 'Nộp bài' }).click();
      // Q-01 B: the viewer stays on the problem; the panel shows the live result strip.
      await expect(fullPanel(page).getByTestId('submit-result')).toBeVisible();
      await expect(page).toHaveURL(/\/problems\/duongdi$/);
      expect(api.requestsTo('POST /problems/duongdi/submit')).toHaveLength(1);
    });

    test('Esc exits and returns focus to the expand button', async ({ page, api }) => {
      await openProblem(page, api, size);
      await openSubmitPanel(page, size);
      await page.getByRole('button', { name: 'Toàn màn hình' }).click();
      await expect(fullPanel(page)).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(fullPanel(page)).toBeHidden();
      await expect(page.getByRole('button', { name: 'Toàn màn hình' })).toBeFocused();
    });
  });

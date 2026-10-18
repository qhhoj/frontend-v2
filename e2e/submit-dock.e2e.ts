import type { Locator, Page } from '@playwright/test';
import { problemDetail } from '../src/test/fixtures';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { dockOf, dockSubmitButton, openDock } from './fixtures/submit-dock';

const LONG_STATEMENT = Array.from(
  { length: 40 },
  (_unused, line) => `<p>Dòng ${line + 1} của đề bài.</p>`,
).join('');
const OVER_LIMIT_LENGTH = 65_537;
const VIEWPORT = { width: 1280, height: 800 };
const boxOf = async (locator: Locator) => (await locator.boundingBox())!;

async function openProblem(page: Page, api: FakeApi, { signedIn = true } = {}) {
  api.signedIn = signedIn;
  api.routes['GET /problems/duongdi'] = {
    body: { data: problemDetail({ descriptionHtml: LONG_STATEMENT }) },
  };
  await page.setViewportSize(VIEWPORT);
  await page.goto('/problems/duongdi');
  await expect(page.locator('#main h1')).toBeVisible();
}
const closeButton = (page: Page) =>
  dockOf(page).getByRole('button', { name: 'Đóng khung nộp bài' });

test.describe('submit dock at 1280 px', () => {
  test('never covers the last line of the statement', async ({ page, api }) => {
    await openProblem(page, api);
    await openDock(page);
    await expect(closeButton(page)).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const lastLine = await boxOf(page.locator('.statement p').last());
    const dock = await boxOf(dockOf(page));
    expect(lastLine.y + lastLine.height).toBeLessThanOrEqual(dock.y);
  });

  test('reserves exactly its own height while open and nothing before opening or after closing', async ({
    page,
    api,
  }) => {
    await openProblem(page, api);
    const reserved = () =>
      page.evaluate(() => document.documentElement.style.getPropertyValue('--dock-height'));
    expect(await reserved()).toBe('');
    await openDock(page);
    // The editor swaps in after the dock shows, so the height is read again on every poll.
    await expect
      .poll(async () => Math.abs(parseFloat(await reserved()) - (await boxOf(dockOf(page))).height))
      .toBeLessThan(1);
    expect((await boxOf(dockOf(page))).height).toBeLessThanOrEqual(VIEWPORT.height * 0.7);
    await closeButton(page).click();
    await expect(dockOf(page)).toHaveCount(0);
    await expect.poll(reserved).toBe('');
  });

  test('keeps the language, submit, full screen and close controls side by side without overlap', async ({
    page,
    api,
  }) => {
    await openProblem(page, api);
    await openDock(page);
    const controls = [
      dockOf(page).getByRole('combobox', { name: 'Ngôn ngữ' }),
      dockSubmitButton(page),
      dockOf(page).getByRole('button', { name: 'Toàn màn hình' }),
      closeButton(page),
    ];
    const boxes = await Promise.all(controls.map(boxOf));
    const rowTop = boxes[0].y;
    for (const box of boxes) expect(Math.abs(box.y - rowTop)).toBeLessThan(box.height);
    for (const [index, box] of boxes.slice(1).entries())
      expect(box.x).toBeGreaterThanOrEqual(boxes[index].x + boxes[index].width);
  });

  test('keeps its layout when one very long line is pasted, and blocks the submit', async ({
    page,
    api,
  }) => {
    await openProblem(page, api);
    await openDock(page);
    const form = dockOf(page).locator('form');
    const before = await boxOf(form);
    await page.locator('.cm-content').first().click();
    await page.keyboard.press('Control+A');
    await page.keyboard.insertText('x'.repeat(OVER_LIMIT_LENGTH));
    await expect(dockOf(page).getByTestId('source-counter')).toHaveClass(/text-negative/);
    const after = await boxOf(form);
    expect(after.x).toBe(before.x);
    expect(after.width).toBe(before.width);
    await expect(dockSubmitButton(page)).toHaveAttribute('aria-disabled', 'true');
  });
});

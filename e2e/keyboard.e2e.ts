import type { Locator, Page } from '@playwright/test';
import { problemDetail } from '../src/test/fixtures';
import { THEMES } from '../src/theme/registry';
import { expect, pdfReady, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';

test('choosing a mode in the panel with the keyboard applies it', async ({ page, api }) => {
  void api;
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/blog');
  const trigger = page.getByRole('button', { name: 'Giao diện', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const panel = page.getByRole('dialog', { name: 'Giao diện' });
  // The style on screen is Clay (the default), so Mode "Sáng" is the Clay light theme.
  const lightTheme = THEMES.find((theme) => theme.scheme === 'light' && !theme.glass)!;
  const lightButton = panel
    .getByRole('group', { name: 'Chế độ' })
    .getByRole('button', { name: 'Sáng', exact: true });
  await lightButton.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('html')).toHaveAttribute('data-theme', lightTheme.id);
  await expect(lightButton).toHaveAttribute('aria-pressed', 'true');
});

test('the points popover takes focus on open and gives it back on Escape', async ({
  page,
  api,
}) => {
  void api;
  await page.goto('/problems');
  const trigger = page.getByRole('button', { name: /^Lọc theo điểm/ });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const popover = page.getByRole('dialog');
  await expect(popover).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(popover.getByRole('spinbutton').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(popover).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

const MIN_RING_WIDTH_PX = 2;
/** What a keyboard user sees on the focused element: a solid outline of a visible colour and at least 2 px. */
const ringOf = (target: Locator) =>
  target.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      style: style.outlineStyle,
      width: parseFloat(style.outlineWidth),
      colour: style.outlineColor,
    };
  });
async function expectFocusRing(target: Locator) {
  const ring = await ringOf(target);
  expect(ring.style, String(target)).toBe('solid');
  expect(ring.width).toBeGreaterThanOrEqual(MIN_RING_WIDTH_PX);
  expect(ring.colour).not.toBe('rgba(0, 0, 0, 0)');
}
const MAX_TABS_TO_REACH = 120;
/** Reaches `target` the way a keyboard user does, so `:focus-visible` applies. */
async function focusByTab(page: Page, target: Locator) {
  for (let step = 0; step < MAX_TABS_TO_REACH; step++) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`${String(target)} cannot be reached with Tab`);
}
const pdfProblem = (api: FakeApi) => {
  api.routes['GET /problems/duongdi'] = {
    body: {
      data: problemDetail(),
    },
  };
  api.routes['GET /problems/duongdi/pdf'] = pdfReady;
};

test.describe('focus rings on the problem page', () => {
  test.beforeEach(({ api }) => {
    api.signedIn = true;
    pdfProblem(api);
  });

  test('tabs, copy button, PDF button and PDF link', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: () => Promise.resolve() },
        configurable: true,
      });
    });
    await page.goto('/problems/duongdi');
    const pdfButton = page.getByTestId('pdf-button');
    const shortLinkButton = page.getByTestId('short-link-button');
    for (const target of [
      page.getByRole('tab', { name: 'Đề bài' }),
      page.locator('.statement button.copy-block').first(),
      shortLinkButton,
      pdfButton,
    ]) {
      await target.focus();
      await expectFocusRing(target);
    }
    // Links-card header actions in DOM order: the PDF button comes right before the short-link button.
    await pdfButton.focus();
    await page.keyboard.press('Tab');
    await expect(shortLinkButton).toBeFocused();
    await pdfButton.focus();
    await page.keyboard.press('Enter');
    const link = page.getByRole('link', { name: 'Mở PDF' });
    await expect(link).toBeFocused();
    await expectFocusRing(link);
  });

  test('dock toggle, language picker, editor and the file dropzone', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/problems/duongdi');
    const dock = page.getByRole('region', { name: 'Nộp bài' });
    const toggle = dock.getByRole('button', { name: 'Thu gọn' });
    await toggle.focus();
    await expectFocusRing(toggle);
    await dock.locator('.cm-content').first().focus();
    await expect(dock.locator('.cm-editor.cm-focused')).toBeVisible();
    // The ring is on the wrapper: the editor's scroll box would clip one drawn on itself.
    await expectFocusRing(dock.locator('.code-editor'));
    await dock.getByRole('combobox', { name: 'Ngôn ngữ' }).click();
    await page.getByRole('option', { name: /Scratch 3/ }).click();
    await focusByTab(page, dock.locator('input[type="file"]'));
    await expectFocusRing(dock.locator('label', { hasText: 'Chọn tệp' }));
  });
});

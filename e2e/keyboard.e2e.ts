import type { Locator, Page } from '@playwright/test';
import { problemDetail, submissionItem } from '../src/test/fixtures';
import { THEMES } from '../src/theme/registry';
import { expect, pdfReady, streamFrame, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';

test('the theme menu opens with Enter, moves with arrows, closes with Escape and returns focus', async ({
  page,
  api,
}) => {
  void api;
  await page.goto('/blog');
  const trigger = page.getByRole('button', { name: 'Đổi giao diện' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(menu).toHaveAttribute('aria-activedescendant', /.+/);
  const first = await menu.getAttribute('aria-activedescendant');
  await page.keyboard.press('ArrowDown');
  expect(await menu.getAttribute('aria-activedescendant')).not.toBe(first);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('choosing a theme item with the keyboard applies it and returns focus to the button', async ({
  page,
  api,
}) => {
  void api;
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/blog');
  const trigger = page.getByRole('button', { name: 'Đổi giao diện' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menu')).toBeFocused();
  // Step down by name, not by count: the order of the menu is not this test's business.
  const target = THEMES.find((theme) => theme.scheme === 'light')!; // Clay light
  for (let step = 0; step < THEMES.length + 2; step += 1) {
    await page.keyboard.press('ArrowDown');
    const activeId = await page.getByRole('menu').getAttribute('aria-activedescendant');
    if ((await page.locator(`[id="${activeId}"]`).innerText()).trim() === 'Clay sáng') break;
  }
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', target.id);
  await expect(page.getByRole('menu')).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('the account menu works from the keyboard and Escape returns focus', async ({ page, api }) => {
  api.signedIn = true;
  await page.goto('/blog');
  const trigger = page.getByRole('button', { name: 'Tài khoản của user_01' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu');
  await expect(menu).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Cài đặt' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
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
/** A select draws its ring on the whole pill, not on the inner combobox element. */
const selectRootOf = (combobox: Locator) =>
  combobox.locator('xpath=ancestor::*[@data-pc-name="select"][1]');
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
      data: problemDetail({ pdfStatementUrl: '/api/internal/problems/duongdi/pdf' }),
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
    const pdfButton = page.locator('#main [data-testid="header-actions"] button');
    for (const target of [
      page.getByRole('tab', { name: 'Đề bài' }),
      page.locator('.statement button.copy-block').first(),
      pdfButton,
    ]) {
      await target.focus();
      await expectFocusRing(target);
    }
    await pdfButton.click();
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

  test('sheet toggle on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/problems/duongdi');
    const open = page.getByRole('button', { name: 'Mở rộng' });
    await open.focus();
    await expectFocusRing(open);
    await open.click();
    const close = page
      .getByRole('dialog', { name: 'Nộp bài' })
      .getByRole('button', { name: 'Thu gọn' });
    await close.focus();
    await expectFocusRing(close);
  });
});

test('focus rings on the submission list: filter rail controls and the N new pill', async ({
  page,
  api,
}) => {
  api.routes['GET /submissions'] = ({ url }) =>
    url.searchParams.get('pageSize') === '1'
      ? {
          body: {
            data: [submissionItem({ id: 'new' })],
            meta: { page: 1, pageSize: 1, total: 103 },
          },
        }
      : {
          body: {
            data: [submissionItem({ id: 'p2' })],
            meta: { page: 2, pageSize: 50, total: 100 },
          },
        };
  api.routes['GET /events/submissions'] = {
    contentType: 'text/event-stream',
    raw: `retry: 600000\n\n${streamFrame('queued', { submissionId: 'new', userId: 'u', problemId: 'p', type: 'queued', status: 'QU' })}`,
  };
  await page.goto('/submissions?page=2');
  const pill = page.getByTestId('new-pill');
  await expect(pill).toBeVisible({ timeout: 6000 });
  const rail = page.getByRole('complementary', { name: 'Bộ lọc' });
  for (const target of [
    pill,
    rail.getByRole('checkbox', { name: /AC/ }),
    rail.getByLabel('Bài', { exact: true }),
    rail.getByTestId('live-toggle'),
  ]) {
    await target.focus();
    await expectFocusRing(target);
  }
  const language = rail.getByRole('combobox', { name: 'Ngôn ngữ' });
  await language.focus();
  await expectFocusRing(selectRootOf(language));
});

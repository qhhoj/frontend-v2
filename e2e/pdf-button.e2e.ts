import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { problemDetail } from '../src/test/fixtures';
import { expect, test } from './fixtures/api';

const CODE = 'pdfdemo';
const PDF_ADDRESS = /\/api\/internal\/problems\/pdfdemo\/pdf\?lang=vi$/;
const PREPARING = {
  status: 202,
  headers: { 'Retry-After': '3', 'Cache-Control': 'no-store' },
  contentType: 'application/json',
  body: JSON.stringify({ data: { status: 'rendering' } }),
};
const READY = { status: 200, contentType: 'application/pdf', body: '%PDF-1.4\n%%EOF\n' };
const FAILED = {
  status: 500,
  contentType: 'application/json',
  body: JSON.stringify({ error: { code: 'internal', message: 'x' } }),
};
const UNAVAILABLE = {
  status: 503,
  headers: { 'Retry-After': '30' },
  contentType: 'application/json',
  body: JSON.stringify({ error: { code: 'pdf_unavailable', message: 'x' } }),
};

/** The problem page's header button, reached with Tab as a keyboard user would. */
const headerButton = (page: Page) => page.getByTestId('pdf-button');
async function focusByTab(page: Page, target: Locator) {
  for (let step = 0; step < 80; step++) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error('the PDF button cannot be reached with Tab');
}
async function expectAxeClean(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .include('#main')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    violations.map(
      (violation) =>
        `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
    ),
  ).toEqual([]);
}

test.beforeEach(({ api }) => {
  api.routes[`GET /problems/${CODE}`] = {
    body: {
      data: problemDetail({
        code: CODE,
      }),
    },
  };
});

test('a keyboard user starts the PDF with Enter, keeps focus while it prepares and lands on Open PDF', async ({
  page,
}) => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  let asked = 0;
  await page.route(PDF_ADDRESS, (route) => {
    asked += 1;
    if (asked > 1) return route.fulfill(READY);
    return held.then(() => route.fulfill(PREPARING));
  });
  await page.goto(`/problems/${CODE}`);
  await focusByTab(page, headerButton(page));
  await page.keyboard.press('Enter');
  await expect(page.locator('#main button[aria-busy="true"]')).toHaveText(/Đang chuẩn bị PDF/);
  await expect(headerButton(page)).toBeFocused();
  await expectAxeClean(page);

  release();
  const link = page.getByRole('link', { name: 'Mở PDF' });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toBeFocused();
  await expectAxeClean(page);
});

test('a failed preparation says so, announces it once and can be tried again after the wait', async ({
  page,
}) => {
  let asked = 0;
  await page.route(PDF_ADDRESS, (route) => {
    asked += 1;
    return route.fulfill(asked === 1 ? FAILED : READY);
  });
  await page.goto(`/problems/${CODE}`);
  await focusByTab(page, headerButton(page));
  await page.keyboard.press('Enter');
  await expect(page.locator('#main [role="status"]')).toHaveText('Không thể chuẩn bị PDF');
  await expect(page.locator('#main')).toContainText('Không thể chuẩn bị PDF');
  await expectAxeClean(page);

  await expect(headerButton(page)).toHaveText('Thử lại');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: 'Mở PDF' })).toBeVisible();
});

test('a 503 makes the button wait out Retry-After, and a press during the wait asks nothing', async ({
  page,
}) => {
  let asked = 0;
  await page.route(PDF_ADDRESS, (route) => {
    asked += 1;
    return route.fulfill(UNAVAILABLE);
  });
  await page.goto(`/problems/${CODE}`);
  await focusByTab(page, headerButton(page));
  await page.keyboard.press('Enter');
  await expect(headerButton(page)).toHaveAttribute('aria-disabled', 'true');
  await expect(headerButton(page)).toContainText('Thử lại sau');
  await expectAxeClean(page);

  // aria-disabled is not a disabled control: the key still reaches it, and the handler must ignore it.
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  expect(asked).toBe(1);
});

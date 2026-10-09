import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminList, adminOk, signInAsStaff } from './fixtures/admin';
import { FLATPAGE_HISTORY, flatpage, flatpageItem } from '../src/test/admin-fixtures/flatpages';

const PREVIEW_HTML = '<h2>Bản xem trước</h2>';

/** The static-pages routes every case needs: the list, the saved page, its history and the live preview. */
function staticPageRoutes(api: Parameters<typeof signInAsStaff>[0]) {
  signInAsStaff(api, [
    'flatpages.change_flatpage',
    'flatpages.add_flatpage',
    'flatpages.delete_flatpage',
  ]);
  api.routes['GET /admin/site/pages'] = adminList([flatpageItem()]);
  api.routes['GET /admin/site/pages/fp-1'] = adminOk(flatpage());
  api.routes['GET /admin/site/pages/fp-1/revisions'] = adminList(FLATPAGE_HISTORY, {
    pageSize: 20,
  });
  api.routes['POST /admin/site/pages/render-preview'] = adminOk({ html: PREVIEW_HTML });
}

async function hasNoHorizontalScroll(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
}

for (const viewport of AUDIT_VIEWPORTS)
  test(`static pages at ${viewport.name}: the live preview follows the typed text and is accessible`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    staticPageRoutes(api);
    await page.goto('/admin/pages?page=fp-1');
    await expect(page.getByTestId('preview-status')).toHaveText('Bản đã lưu');
    await page.getByLabel('Nội dung (Markdown)').fill('## Mới');
    await expect(page.getByTestId('preview-status')).toContainText('Đã cập nhật');
    await expect(page.getByTestId('preview')).toContainText('Bản xem trước');
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(await hasNoHorizontalScroll(page)).toBe(true);
    expect(api.requestsTo('POST /admin/site/pages/render-preview')).toHaveLength(1);
  });

for (const viewport of AUDIT_VIEWPORTS)
  test(`static page history at ${viewport.name}: the first change is open and the table keeps time, action and buttons`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    staticPageRoutes(api);
    await page.goto('/admin/pages?page=fp-1&tab=history');
    await expect(page.getByTestId('revision')).toHaveCount(3);
    await expect(page.getByText('+ Giới thiệu QHHOJ')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Xem thay đổi' }).first()).toBeVisible();
    await expect(page.getByText('Nạp giá trị cũ').first()).toBeVisible();
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(await hasNoHorizontalScroll(page)).toBe(true);
  });

test('static page: "Nạp giá trị cũ" from the keyboard fills the title, shows the note and saves nothing', async ({
  page,
  api,
}) => {
  staticPageRoutes(api);
  await page.goto('/admin/pages?page=fp-1&tab=history');
  const loadButton = page.getByRole('button', { name: 'Nạp giá trị cũ' }).first();
  await loadButton.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Tiêu đề')).toBeFocused();
  await expect(page.getByLabel('Tiêu đề')).toHaveValue('Giới thiệu');
  await expect(page.getByText('Đã nạp giá trị cũ của bản')).toBeVisible();
  expect(api.requestsTo('PATCH /admin/site/pages/fp-1')).toHaveLength(0);
});

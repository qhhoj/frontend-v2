import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { adminList, confirmInDialog, signInAsStaff } from './fixtures/admin';
import { AUDIT_VIEWPORTS, applyTheme, axeViolationsIn, AUDIT_THEMES } from './fixtures/audit';

const PERMISSIONS = ['judge.manage_short_link'];
const staff = (api: FakeApi) => signInAsStaff(api, PERMISSIONS);

test('creates a chosen-code link and deletes another after confirming', async ({ page, api }) => {
  staff(api);
  await page.goto('/admin/short-links');
  await page.getByLabel('Đường dẫn trong trang').fill('/contests/r42');
  await page.getByLabel('Mã tùy chọn').fill('thi-thu');
  await page.getByRole('button', { name: 'Tạo liên kết' }).click();
  await expect(page.getByTestId('short-link-created')).toBeVisible();
  const sent = api.requestsTo('POST /short-links')[0].postData!.toString();
  expect(JSON.parse(sent)).toMatchObject({ code: 'thi-thu' });
  await page.getByRole('button', { name: 'Xóa liên kết hsg-2026' }).click();
  await confirmInDialog(page, 'Xóa liên kết');
  await expect(page.getByText('Đã xóa /s/hsg-2026')).toBeVisible();
  await expect(page.locator('#short-links-table')).toBeFocused();
});

test('shows the staff Bit in the header and on the empty list', async ({ page, api }) => {
  staff(api);
  api.routes['GET /short-links'] = adminList([]);
  await page.goto('/admin/short-links');
  await expect(page.locator('[data-testid="admin-bit"][data-placement="header"]')).toBeVisible();
  await expect(page.locator('[data-testid="admin-bit"][data-placement="empty"]')).toBeVisible();
});

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of AUDIT_THEMES)
    test(`the short-link table is accessible at ${viewport.name} in ${theme.id}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize(viewport);
      staff(api);
      await applyTheme(page, api, theme);
      await page.goto('/admin/short-links');
      await expect(page.getByTestId('short-links-table')).toBeVisible();
      expect(await axeViolationsIn(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });

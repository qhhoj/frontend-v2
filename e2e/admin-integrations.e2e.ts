import { INTEGRATION_KEY, integrationClient } from '../src/test/f5-fixtures';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { adminList, confirmInDialog, signInAsStaff } from './fixtures/admin';
import { AUDIT_VIEWPORTS, applyTheme, axeViolationsIn, AUDIT_THEMES } from './fixtures/audit';

const staff = (api: FakeApi) => signInAsStaff(api, ['judge.manage_integration']);

test('creates a client, reveals its key once, and revokes it after confirming', async ({
  page,
  api,
}) => {
  staff(api);
  await page.goto('/admin/integrations');
  await page.getByRole('button', { name: 'Thêm hệ thống' }).click();
  await page.getByLabel('Tên hệ thống').fill('Hệ thống thi tỉnh');
  await page.getByRole('checkbox', { name: /contests:write/ }).check();
  await page.getByLabel('Địa chỉ được gọi (CIDR)').fill('10.0.0.0/8');
  await page.getByLabel('Hành động dưới tên').fill('syncauthor');
  await page.getByRole('button', { name: 'Tạo khóa' }).click();
  await expect(page.getByRole('dialog', { name: 'Khóa của Hệ thống thi tỉnh' })).toContainText(
    INTEGRATION_KEY,
  );
  await expect(page.locator('#key-saved')).toBeFocused();
  await page.locator('#key-saved').check();
  await page.getByTestId('key-close').click();
  await expect(page.getByText(INTEGRATION_KEY)).toHaveCount(0);
  await page.getByRole('button', { name: 'Thu hồi khóa của Hệ thống thi tỉnh' }).click();
  await confirmInDialog(page, 'Thu hồi khóa');
  await expect(page.getByText('Đã thu hồi khóa của Hệ thống thi tỉnh')).toBeVisible();
  expect(api.requestsTo(`DELETE /integration-clients/${integrationClient().id}`)).toHaveLength(1);
});

test('shows the one staff Bit on the empty list only', async ({ page, api }) => {
  staff(api);
  api.routes['GET /integration-clients'] = adminList([]);
  await page.goto('/admin/integrations');
  await expect(page.locator('[data-testid="admin-bit"][data-placement="empty"]')).toBeVisible();
  await expect(page.getByTestId('admin-bit')).toHaveCount(1);
});

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of AUDIT_THEMES)
    test(`the integration screen is accessible at ${viewport.name} in ${theme.id}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize(viewport);
      staff(api);
      await applyTheme(page, api, theme);
      await page.goto('/admin/integrations');
      await expect(page.getByTestId('integration-table')).toBeVisible();
      expect(await axeViolationsIn(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });

test('the key dialog is accessible', async ({ page, api }) => {
  staff(api);
  await page.goto('/admin/integrations');
  await page.getByRole('button', { name: 'Thêm hệ thống' }).click();
  await page.getByLabel('Tên hệ thống').fill('Cổng');
  await page.getByRole('checkbox', { name: /contests:read/ }).check();
  await page.getByLabel('Địa chỉ được gọi (CIDR)').fill('10.0.0.0/8');
  await page.getByLabel('Hành động dưới tên').fill('syncauthor');
  await page.getByRole('button', { name: 'Tạo khóa' }).click();
  await expect(page.getByRole('dialog', { name: 'Khóa của Hệ thống thi tỉnh' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  expect(await axeViolationsIn(page)).toEqual([]);
});

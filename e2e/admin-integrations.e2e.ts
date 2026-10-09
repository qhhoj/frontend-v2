import { INTEGRATION_KEY, integrationClient } from '../src/test/f5-fixtures';
import { THEMES } from '../src/theme/registry';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { adminList, confirmInDialog, dialogOf, signInAsStaff } from './fixtures/admin';
import { AUDIT_VIEWPORTS, applyTheme, axeViolationsIn } from './fixtures/audit';
import { PHONE_AND_DESKTOP, defineShiftTests } from './fixtures/layout-shift';

const staff = (api: FakeApi) => signInAsStaff(api, ['judge.manage_integration']);

test('creates a client, reveals its key once, and revokes it after confirming', async ({
  page,
  api,
}) => {
  staff(api);
  await page.goto('/admin/integrations');
  await page.getByLabel('Tên hệ thống').fill('Hệ thống thi tỉnh');
  await page.getByRole('checkbox', { name: /contests:write/ }).check();
  await page.getByLabel('Địa chỉ được gọi (CIDR)').fill('10.0.0.0/8');
  await page.getByLabel('Hành động dưới tên').fill('syncauthor');
  await page.getByRole('button', { name: 'Tạo khoá' }).click();
  await expect(dialogOf(page)).toContainText(INTEGRATION_KEY);
  await expect(page.locator('#key-saved')).toBeFocused();
  await page.locator('#key-saved').check();
  await page.getByTestId('key-close').click();
  await expect(page.getByText(INTEGRATION_KEY)).toHaveCount(0);
  await page.getByRole('button', { name: 'Thu hồi khoá của Hệ thống thi tỉnh' }).click();
  await confirmInDialog(page, 'Thu hồi khoá');
  await expect(page.getByText('Đã thu hồi khoá của Hệ thống thi tỉnh')).toBeVisible();
  expect(api.requestsTo(`DELETE /integration-clients/${integrationClient().id}`)).toHaveLength(1);
});

test('shows the staff Bit in the header and on the empty list', async ({ page, api }) => {
  staff(api);
  api.routes['GET /integration-clients'] = adminList([]);
  await page.goto('/admin/integrations');
  await expect(page.locator('[data-testid="admin-bit"][data-placement="header"]')).toBeVisible();
  await expect(page.locator('[data-testid="admin-bit"][data-placement="empty"]')).toBeVisible();
});

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
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
  await page.getByLabel('Tên hệ thống').fill('Cổng');
  await page.getByRole('checkbox', { name: /contests:read/ }).check();
  await page.getByLabel('Địa chỉ được gọi (CIDR)').fill('10.0.0.0/8');
  await page.getByLabel('Hành động dưới tên').fill('syncauthor');
  await page.getByRole('button', { name: 'Tạo khoá' }).click();
  await expect(dialogOf(page)).toBeVisible();
  expect(await axeViolationsIn(page)).toEqual([]);
});

defineShiftTests([
  {
    name: 'integration client table',
    path: '/admin/integrations',
    signedIn: true,
    hold: 'GET /integration-clients',
    answer: (api) => {
      staff(api);
      api.routes['GET /integration-clients'] = adminList([
        integrationClient({ name: 'Cổng 1' }),
        integrationClient({ id: 'c-2', name: 'Cổng 2' }),
        integrationClient({ id: 'c-3', name: 'Cổng 3' }),
      ]);
    },
    parts: (page) => ({
      'client rows': page.locator('[data-skeleton-region="integration-row"], tr[data-client]'),
    }),
    viewports: PHONE_AND_DESKTOP,
  },
]);

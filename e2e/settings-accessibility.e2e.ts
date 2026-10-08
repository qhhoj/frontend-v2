import type { Page } from '@playwright/test';
import { THEMES } from '../src/theme/registry';
import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, applyTheme, axeViolationsIn } from './fixtures/audit';

/** Each settings state worth auditing: the page, what to do on it, and what proves it is drawn. */
const STATES: ReadonlyArray<{
  name: string;
  path: string;
  open?: (page: Page) => Promise<void>;
  ready: string;
}> = [
  { name: 'profile', path: '/settings', ready: 'Mặc định và hiển thị' },
  { name: 'security', path: '/settings/security', ready: 'Xác thực hai bước' },
  {
    name: 'enrolment QR step',
    path: '/settings/security',
    open: async (page) => {
      await page.getByRole('button', { name: 'Bật', exact: true }).click();
      await page
        .locator('form[data-step="password"]')
        .getByLabel('Mật khẩu hiện tại')
        .fill('mật khẩu');
      await page.getByRole('button', { name: 'Tiếp tục' }).click();
    },
    ready: 'Khoá thiết lập',
  },
  {
    name: 'confirm dialog',
    path: '/settings/security',
    open: (page) => page.getByRole('button', { name: 'Đăng xuất mọi nơi' }).click(),
    ready: 'Đăng xuất mọi nơi?',
  },
  { name: 'data', path: '/settings/data', ready: 'Giới hạn' },
];

for (const theme of THEMES)
  for (const viewport of AUDIT_VIEWPORTS)
    for (const state of STATES)
      test(`${state.name}: no axe violations in ${theme.id} at ${viewport.name}`, async ({
        page,
        api,
      }) => {
        api.signedIn = true;
        await applyTheme(page, api, theme);
        await page.setViewportSize(viewport);
        await page.goto(state.path);
        await state.open?.(page);
        await expect(page.getByText(state.ready, { exact: true }).first()).toBeVisible();
        expect(await axeViolationsIn(page)).toEqual([]);
      });

for (const theme of THEMES)
  test(`impersonation banner: no axe violations in ${theme.id}`, async ({ page, api }) => {
    api.signedIn = true;
    api.impersonatorId = 'staff-1';
    await applyTheme(page, api, theme);
    await page.goto('/settings/security');
    await expect(page.getByRole('region', { name: 'Đang xem dưới tên người khác' })).toBeVisible();
    expect(await axeViolationsIn(page)).toEqual([]);
  });

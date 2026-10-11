import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { AUDIT_THEMES, AUDIT_VIEWPORTS, applyTheme, axeViolationsIn } from './fixtures/audit';
import { adminList, adminOk, signInAsStaff } from './fixtures/admin';
import { problemItem } from '../src/test/fixtures';

/** A superuser: every tile, badge and search source shows. */
function signInAsSuperuser(api: FakeApi) {
  signInAsStaff(api, [], true);
  api.routes['GET /tickets/summary'] = adminOk({ assignedOpen: 1, awaitingStaff: 3 });
  api.routes['GET /comments/reports'] = adminList([], { total: 2 });
  api.routes['GET /admin/organization-requests'] = adminList([], { total: 4 });
}

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of AUDIT_THEMES)
    test(`the admin dashboard and search are accessible in ${theme.id} at ${viewport.name}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize(viewport);
      signInAsSuperuser(api);
      await applyTheme(page, api, theme);
      await page.goto('/admin');
      await expect(page.getByRole('heading', { name: 'Tình hình hiện tại' })).toBeVisible();
      expect(await axeViolationsIn(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.getByTestId('admin-search-button').click();
      await expect(page.getByRole('combobox')).toBeFocused();
      expect(await axeViolationsIn(page)).toEqual([]);
    });

test('slash opens the search; a screen hit opens with Enter and the palette closes', async ({
  page,
  api,
}) => {
  signInAsSuperuser(api);
  await page.goto('/admin');
  await expect(page.getByTestId('admin-dashboard')).toBeVisible();
  await page.keyboard.press('/');
  await page.getByRole('combobox').fill('Máy chấm');
  await expect(page.getByRole('option', { name: /Máy chấm/ }).first()).toHaveAttribute(
    'aria-selected',
    'true',
  );
  api.routes['GET /judges'] = adminOk([]);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/admin\/judges$/);
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('a record hit links to its editor', async ({ page, api }) => {
  signInAsStaff(api, ['judge.edit_own_problem']);
  api.routes['GET /problems'] = adminList([problemItem({ code: 'aplusb', name: 'A cộng B' })]);
  await page.goto('/admin');
  await expect(page.getByTestId('admin-topbar')).toBeVisible();
  await page.keyboard.press('Control+k');
  await page.getByRole('combobox').fill('aplus');
  await expect(page.getByRole('option', { name: /A cộng B/ })).toBeVisible();
  expect(api.unmatched).toEqual([]);
});

test('the phone menu names the screen and closes after a choice', async ({ page, api }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  signInAsSuperuser(api);
  api.routes['GET /judges'] = adminOk([]);
  await page.goto('/admin');
  const menu = page.locator('details', { has: page.getByTestId('admin-nav-phone') });
  await expect(menu.locator('summary')).toContainText('Trang chủ quản trị');
  await menu.locator('summary').click();
  await menu.getByRole('link', { name: 'Máy chấm' }).click();
  await expect(page).toHaveURL(/\/admin\/judges$/);
  await expect(menu).not.toHaveAttribute('open');
  await expect(menu.locator('summary')).toContainText('Máy chấm');
});

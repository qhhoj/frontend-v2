import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminList, adminOk, signInAsStaff } from './fixtures/admin';
import { ALL_SETTINGS, settingRevision } from '../src/test/admin-fixtures/settings';

for (const viewport of AUDIT_VIEWPORTS)
  test(`site settings at ${viewport.name}: the page and the history panel are accessible`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, ['judge.change_settings']);
    api.routes['GET /admin/settings'] = adminOk(ALL_SETTINGS);
    api.routes['GET /admin/settings/pdf.renderTimeoutMs/revisions'] = adminList(
      [settingRevision(30000, 45000)],
      { pageSize: 20 },
    );
    await page.goto('/admin/settings');
    await expect(page.getByRole('heading', { name: 'Cài đặt trang', exact: true })).toBeVisible();
    expect(await axeViolationsIn(page)).toEqual([]);

    await page.getByRole('button', { name: 'Lịch sử · pdf.renderTimeoutMs', exact: true }).click();
    await expect(page.getByTestId('revisions')).toContainText('− 30000');
    expect(await axeViolationsIn(page)).toEqual([]);
  });

test('site settings: Enter on "Thay thế" reveals the password box with focus in it', async ({
  page,
  api,
}) => {
  signInAsStaff(api, ['judge.change_settings']);
  api.routes['GET /admin/settings'] = adminOk(ALL_SETTINGS);
  await page.goto('/admin/settings');
  const mailBlock = page.locator('[data-block="mail"]');
  await mailBlock.getByRole('button', { name: 'Thay thế', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(mailBlock.locator('input[type="password"]')).toBeFocused();
  expect(api.requestsTo('PATCH /admin/settings/mail.smtpUrl')).toHaveLength(0);
});

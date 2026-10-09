import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminList, adminOk, dialogOf, signInAsStaff } from './fixtures/admin';
import { ALL_SETTINGS, setting, settingRevision } from '../src/test/admin-fixtures/settings';

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
    const panelHeading = page.getByRole('heading', {
      name: 'Lịch sử · pdf.renderTimeoutMs',
      exact: true,
    });
    await expect(panelHeading).toBeInViewport();
    await expect(panelHeading).toBeFocused();
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

for (const viewport of AUDIT_VIEWPORTS)
  test(`site settings at ${viewport.name}: a reset fills the default and only "Lưu" sends it`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, ['judge.change_settings']);
    api.routes['GET /admin/settings'] = adminOk(
      ALL_SETTINGS.map((entry) =>
        entry.key === 'similarity.minPercent'
          ? setting('similarity.minPercent', 65, { default: 50, isDefault: false })
          : entry,
      ),
    );
    api.routes['PATCH /admin/settings/similarity.minPercent'] = adminOk(
      setting('similarity.minPercent', 50, { default: 50, isDefault: true }),
    );
    await page.goto('/admin/settings');
    const row = page.locator('[data-key="similarity.minPercent"]');
    await row.getByRole('button', { name: 'Về mặc định 50' }).focus();
    await page.keyboard.press('Enter');
    await expect(row.getByRole('spinbutton')).toHaveValue('50');
    await expect(row).toContainText('Đã điền giá trị mặc định, chưa lưu. Giá trị đang lưu: 65.');
    expect(api.requestsTo('PATCH /admin/settings/similarity.minPercent')).toHaveLength(0);
    expect(await axeViolationsIn(page)).toEqual([]);

    await page
      .locator('[data-block="similarity"]')
      .getByRole('button', { name: 'Lưu', exact: true })
      .focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status').filter({ hasText: 'Đã lưu.' })).toBeVisible();
    expect(api.requestsTo('PATCH /admin/settings/similarity.minPercent')).toHaveLength(1);
  });

for (const viewport of AUDIT_VIEWPORTS)
  test(`site settings at ${viewport.name}: clearing the SMTP URL is confirmed from the keyboard and sends one empty value`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, ['judge.change_settings']);
    api.routes['GET /admin/settings'] = adminOk(ALL_SETTINGS);
    api.routes['PATCH /admin/settings/mail.smtpUrl'] = adminOk(
      setting('mail.smtpUrl', { set: false }),
    );
    await page.goto('/admin/settings');
    const mailBlock = page.locator('[data-block="mail"]');
    await mailBlock.getByRole('button', { name: 'Xoá bí mật', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(dialogOf(page)).toContainText('Xoá URL SMTP?');
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(api.requestsTo('PATCH /admin/settings/mail.smtpUrl')).toHaveLength(0);

    await dialogOf(page).getByRole('button', { name: 'Xoá URL SMTP', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(mailBlock).toContainText('Đã xoá URL SMTP.');
    await expect(dialogOf(page)).toBeHidden();
    const sent = api.requestsTo('PATCH /admin/settings/mail.smtpUrl');
    expect(sent).toHaveLength(1);
    expect(JSON.parse(sent[0].postData!.toString())).toEqual({ value: '' });
    expect(await axeViolationsIn(page)).toEqual([]);
  });

for (const viewport of AUDIT_VIEWPORTS)
  test(`change log at ${viewport.name}: the key in the URL shows its revisions and is accessible`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, ['judge.change_settings']);
    api.routes['GET /admin/settings/pdf.renderTimeoutMs/revisions'] = adminList(
      [settingRevision(30000, 45000), settingRevision(20000, 30000)],
      { pageSize: 20 },
    );
    await page.goto('/admin/log?key=pdf.renderTimeoutMs');
    await expect(
      page.getByRole('heading', { name: 'Nhật ký thay đổi', exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId('revision')).toHaveCount(2);
    expect(await axeViolationsIn(page)).toEqual([]);
  });

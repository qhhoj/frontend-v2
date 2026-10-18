import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminOk, dialogOf, signInAsStaff } from './fixtures/admin';
import { ALL_SETTINGS, setting } from '../src/test/admin-fixtures/settings';

/** The Discord block reads its own webhook list. */
test.beforeEach(({ api }) => {
  api.routes['GET /admin/discord-webhooks'] = adminOk([]);
});

test('site settings: Enter on "Thay thế" reveals the password box with focus in it', async ({
  page,
  api,
}) => {
  signInAsStaff(api, ['judge.change_settings']);
  api.routes['GET /admin/settings'] = adminOk(ALL_SETTINGS);
  await page.goto('/admin/settings?tab=accounts');
  const mailBlock = page.locator('[data-block="mail"]');
  await mailBlock.getByRole('button', { name: 'Thay thế', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(mailBlock.locator('input[type="password"]')).toBeFocused();
  expect(api.requestsTo('PATCH /admin/settings/mail.smtpUrl')).toHaveLength(0);
});

test('site settings: the search status stays in the accessibility tree while empty, takes no space, and shows the count', async ({
  page,
  api,
}) => {
  signInAsStaff(api, ['judge.change_settings']);
  api.routes['GET /admin/settings'] = adminOk(ALL_SETTINGS);
  await page.goto('/admin/settings');
  const status = page.getByRole('status').and(page.getByTestId('settings-search-status'));
  await expect(status).toBeEmpty();
  await expect(status).toHaveCount(1);
  expect((await status.boundingBox())!.width).toBeLessThanOrEqual(1);

  await page.locator('input[type="search"]').fill('mail');
  await expect(status).toContainText('cài đặt khớp');
  expect((await status.boundingBox())!.width).toBeGreaterThan(1);
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
    await page.goto('/admin/settings?tab=limits');
    const row = page.locator('[data-key="similarity.minPercent"]');
    const info = row.getByRole('button', { name: 'Chi tiết similarity.minPercent' });
    await info.click();
    const popover = page.getByRole('dialog', { name: 'Thông tin similarity.minPercent' });
    await expect(popover.getByRole('button', { name: 'Lịch sử' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(popover.getByRole('button', { name: 'Về mặc định 50' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(info).toBeFocused();
    await expect(row.getByRole('spinbutton')).toHaveValue('50');
    await expect(row).toContainText('Đã điền giá trị mặc định, chưa lưu. Giá trị đang lưu: 65.');
    expect(api.requestsTo('PATCH /admin/settings/similarity.minPercent')).toHaveLength(0);
    expect(await axeViolationsIn(page)).toEqual([]);

    const saveBar = page.getByTestId('settings-save-bar');
    await expect(saveBar).toContainText('1 thay đổi chưa lưu');
    await saveBar.getByRole('button', { name: 'Lưu thay đổi', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(saveBar.getByRole('status')).toContainText('Đã lưu lúc');
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
    await page.goto('/admin/settings?tab=accounts');
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

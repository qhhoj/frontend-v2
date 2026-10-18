import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminList, adminOk, signInAsStaff } from './fixtures/admin';
import { siteData } from '../src/test/admin-fixtures/site';

/** The site notice is a misc config key: its own permission opens the settings page on the "Văn bản công khai" tab. */
const CONFIG_PERMS = ['judge.change_miscconfig'];

for (const viewport of AUDIT_VIEWPORTS)
  test(`site notice at ${viewport.name}: the old raw config address opens the notice, saved from the one save bar`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, CONFIG_PERMS);
    api.routes['GET /site'] = adminOk(siteData());
    api.routes['GET /admin/site/config/top_notification/revisions'] = adminList([]);
    api.routes['PUT /admin/site/config/top_notification'] = adminOk({
      key: 'top_notification',
      value: 'Bảo trì lúc 22:00',
    });

    await page.goto('/admin/config');
    await expect(page).toHaveURL(/\/admin\/settings\?tab=public/);
    await page.getByLabel('Nội dung thông báo').fill('Bảo trì lúc 22:00');
    expect(await axeViolationsIn(page)).toEqual([]);
    const saveBar = page.getByTestId('settings-save-bar');
    await expect(saveBar).toContainText('1 thay đổi chưa lưu');
    await saveBar.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await expect(saveBar.getByRole('status')).toContainText('Đã lưu lúc');
    expect(api.requestsTo('PUT /admin/site/config/top_notification')).toHaveLength(1);
    expect(api.requestsTo('GET /admin/settings')).toHaveLength(0);
  });

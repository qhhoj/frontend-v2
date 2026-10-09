import { expect, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminOk, confirmInDialog, dialogOf, signInAsStaff } from './fixtures/admin';
import { siteData } from '../src/test/admin-fixtures/site';

const CONFIG_PERMS = ['judge.change_miscconfig'];

for (const viewport of AUDIT_VIEWPORTS)
  test(`raw config at ${viewport.name}: the HTML preview is sandboxed and a script value never runs`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, CONFIG_PERMS);
    api.routes['GET /site'] = adminOk(siteData());
    api.routes['PUT /admin/site/config/announcement'] = adminOk({
      key: 'announcement',
      value: '<script>window.ran = true</script>',
    });
    let dialogsOpened = 0;
    page.on('dialog', () => (dialogsOpened += 1));

    await page.goto('/admin/config');
    expect(await axeViolationsIn(page)).toEqual([]);
    await page.getByRole('button', { name: 'announcement' }).click();
    await expect(page.locator('iframe[title="Xem trước giá trị HTML"]')).toHaveAttribute(
      'sandbox',
      '',
    );
    // Not axe-scanned: AxeBuilder hangs on a sandboxed srcdoc frame in this harness. The frame has its title.

    await page.getByLabel('Giá trị (tối đa 20 000 ký tự)').fill('<script>alert(1)</script>');
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Đã lưu announcement.' }),
    ).toBeVisible();
    expect(api.requestsTo('PUT /admin/site/config/announcement')).toHaveLength(1);
    expect(dialogsOpened).toBe(0);
  });

for (const viewport of AUDIT_VIEWPORTS)
  test(`raw config at ${viewport.name}: a link key refuses a non-http value`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, CONFIG_PERMS);
    api.routes['GET /site'] = adminOk(siteData());

    await page.goto('/admin/config');
    await page.getByRole('button', { name: 'discord_invite_link' }).click();
    await page.getByLabel('Giá trị (tối đa 20 000 ký tự)').fill('ftp://x');
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(page.getByText('Khoá liên kết chỉ nhận http hoặc https.').first()).toBeVisible();
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(api.requestsTo('PUT /admin/site/config/discord_invite_link')).toHaveLength(0);
  });

for (const viewport of AUDIT_VIEWPORTS)
  test(`raw config at ${viewport.name}: deleting a key asks first`, async ({ page, api }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, CONFIG_PERMS);
    api.routes['GET /site'] = adminOk(siteData());
    api.routes['DELETE /admin/site/config/contact_email'] = { status: 204 };

    await page.goto('/admin/config');
    await page.getByRole('button', { name: 'contact_email' }).click();
    await page.getByRole('button', { name: 'Xoá khoá', exact: true }).click();
    await expect(dialogOf(page)).toContainText('Mọi trang ngừng dùng giá trị này ngay.');
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(api.requestsTo('DELETE /admin/site/config/contact_email')).toHaveLength(0);

    await confirmInDialog(page, 'Xoá khoá');
    await expect(page.getByRole('button', { name: 'contact_email' })).toHaveCount(0);
    expect(api.requestsTo('DELETE /admin/site/config/contact_email')).toHaveLength(1);
  });

const NAV_PERMS = ['judge.change_navigationbar'];

for (const viewport of AUDIT_VIEWPORTS)
  test(`navigation bar at ${viewport.name}: the edit dialog refuses a bad regex and Escape returns focus to its row`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, NAV_PERMS);
    api.routes['GET /site'] = adminOk(siteData());

    await page.goto('/admin/nav');
    await expect(page.getByRole('button', { name: 'Sửa' }).first()).toBeVisible();
    expect(await axeViolationsIn(page)).toEqual([]);

    const editButton = page
      .getByRole('row')
      .filter({ hasText: 'blog' })
      .first()
      .getByRole('button', { name: 'Sửa' });
    await editButton.click();
    await page.locator('#nav-regex').fill('(');
    await confirmInDialog(page, 'Lưu');
    await expect(page.locator('#nav-regex')).toHaveAttribute('aria-invalid', 'true');
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(api.requestsTo('PATCH /admin/site/navigation/nav-blog')).toHaveLength(0);

    await page.keyboard.press('Escape');
    await expect(dialogOf(page)).toBeHidden();
    await expect(editButton).toBeFocused();
  });

for (const viewport of AUDIT_VIEWPORTS)
  test(`navigation bar at ${viewport.name}: a broken regex shows on its row`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, NAV_PERMS);
    api.routes['GET /site'] = adminOk(siteData());

    await page.goto('/admin/nav');
    const brokenRow = page.getByRole('row').filter({ hasText: 'b-old' });
    await expect(brokenRow.getByText('Regex lỗi')).toBeVisible();
  });

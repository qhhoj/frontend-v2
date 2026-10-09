import { postItem } from '../src/test/community-fixtures';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminList, adminOk, confirmInDialog, dialogOf, signInAsStaff } from './fixtures/admin';
import { expect, test } from './fixtures/api';

const HIDE_LABEL = 'Ẩn bài';

for (const viewport of AUDIT_VIEWPORTS)
  test(`blog moderation at ${viewport.name}: keyboard hide confirms, then the post leaves the list`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, ['judge.edit_all_post']);
    api.routes['GET /posts'] = adminList([postItem({ id: 'p-2', title: 'Bán tài khoản VIP' })]);
    api.routes['GET /admin/posts'] = adminList([]);
    api.routes['PATCH /posts/:id'] = adminOk({});
    await page.goto('/admin/posts');
    const row = page.getByRole('row', { name: /Bán tài khoản VIP/ });
    await expect(row).toBeVisible();
    expect(await axeViolationsIn(page)).toEqual([]);

    await row.getByRole('button', { name: HIDE_LABEL, exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(dialogOf(page)).toContainText('Ẩn “Bán tài khoản VIP”?');
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(api.requestsTo('PATCH /posts/p-2')).toHaveLength(0);

    api.routes['GET /posts'] = adminList([]);
    await confirmInDialog(page, HIDE_LABEL);
    await expect(page.getByRole('status').filter({ hasText: 'Đã ẩn bài.' })).toBeVisible();
    await expect(dialogOf(page)).toBeHidden();
    await expect(page.getByText('Không có bài nào.')).toBeVisible();
    expect(api.requestsTo('PATCH /posts/p-2')).toHaveLength(1);
    expect(await axeViolationsIn(page)).toEqual([]);
  });

for (const viewport of AUDIT_VIEWPORTS)
  test(`hidden blog post at ${viewport.name}: "Hiện lại" confirms and the post leaves the hidden queue`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    signInAsStaff(api, ['judge.edit_all_post']);
    api.routes['GET /posts'] = adminList([]);
    api.routes['GET /admin/posts'] = adminList([
      postItem({
        id: 'h-1',
        title: 'Bản nháp cũ',
        visible: false,
        publishOn: '2026-10-06T22:10:00Z',
      }),
    ]);
    api.routes['PATCH /posts/:id'] = adminOk({});
    await page.goto('/admin/posts?feed=hidden');
    await expect(page.getByRole('row', { name: /Bản nháp cũ/ })).toBeVisible();

    await page.getByRole('button', { name: 'Hiện lại', exact: true }).click();
    await expect(dialogOf(page)).toContainText('Hiện lại bài viết?');
    expect(await axeViolationsIn(page)).toEqual([]);

    api.routes['GET /admin/posts'] = adminList([]);
    await confirmInDialog(page, 'Hiện lại');
    await expect(dialogOf(page)).toBeHidden();
    await expect(page.getByText('Không có bài nào.')).toBeVisible();
    expect(api.requestsTo('PATCH /posts/h-1')).toHaveLength(1);
    expect(await axeViolationsIn(page)).toEqual([]);
  });

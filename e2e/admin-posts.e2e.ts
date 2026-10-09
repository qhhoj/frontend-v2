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

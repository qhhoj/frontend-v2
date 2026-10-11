import { cannedReply } from '../src/test/community-fixtures';
import { adminList, adminOk, confirmInDialog, dialogOf, signInAsStaff } from './fixtures/admin';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { applyTheme, AUDIT_VIEWPORTS, axeViolationsIn, AUDIT_THEMES } from './fixtures/audit';

const PATH = '/admin/tickets/canned';
const FIVE = Array.from({ length: 5 }, (_item, index) =>
  cannedReply({ id: `r-${index}`, title: `Mẫu ${index + 1}`, body: 'Chào {tên}.', order: index }),
);
const withReplies = (api: FakeApi, replies = FIVE) => {
  signInAsStaff(api, ['judge.change_ticket']);
  api.routes['GET /ticket-canned-replies'] = adminList(replies, { pageSize: 100 });
};

test('a handler adds a canned reply and sees it saved', async ({ page, api }) => {
  withReplies(api, []);
  api.routes['POST /ticket-canned-replies'] = () => {
    api.routes['GET /ticket-canned-replies'] = adminList([cannedReply()], { pageSize: 100 });
    return { status: 201, ...adminOk(cannedReply()) };
  };
  await page.goto(PATH);
  await expect(page.getByText('Chưa có mẫu trả lời nào.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Thêm mẫu' }).click();
  await dialogOf(page).getByLabel('Tiêu đề').fill('Đã nhận phiếu');
  await dialogOf(page)
    .getByLabel('Nội dung')
    .fill('Chào {tên}, cảm ơn bạn đã báo lỗi ở bài {bài}.');
  await confirmInDialog(page, 'Lưu mẫu');
  await expect(page.getByText('Đã lưu mẫu “Đã nhận phiếu”.')).toBeVisible();
  await expect(page.locator('#canned-replies-table')).toContainText('Đã nhận phiếu');
});

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of AUDIT_THEMES)
    for (const state of ['list', 'empty'] as const)
      test(`the ${state} canned-reply screen has no WCAG 2.1 A/AA violations in ${theme.id}, ${viewport.name}`, async ({
        page,
        api,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        withReplies(api, state === 'list' ? FIVE : []);
        await applyTheme(page, api, theme);
        await page.goto(PATH);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page.locator('#canned-replies-table')).toContainText(
          state === 'list' ? 'Mẫu 1' : 'Chưa có mẫu trả lời nào.',
        );
        // One Bit at most, and only in the empty state (pages/admin.md, "Bit in admin").
        await expect(page.locator('[data-testid="admin-bit"]')).toHaveCount(
          state === 'empty' ? 1 : 0,
        );
        expect(await axeViolationsIn(page)).toEqual([]);
      });

test('the screen and its open dialog do not scroll sideways at 375 px', async ({ page, api }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  withReplies(api);
  await page.goto(PATH);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const overflows = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
  expect(await overflows()).toBe(false);
  await page.getByRole('button', { name: 'Thêm mẫu' }).click();
  await expect(dialogOf(page)).toBeVisible();
  expect(await overflows()).toBe(false);
});

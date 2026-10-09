import { cannedReply } from '../src/test/community-fixtures';
import { THEMES } from '../src/theme/registry';
import { adminList, adminOk, confirmInDialog, dialogOf, signInAsStaff } from './fixtures/admin';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { applyTheme, AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { defineShiftTests, PHONE_AND_DESKTOP } from './fixtures/layout-shift';

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
  await expect(page.getByRole('rowheader', { name: 'Đã nhận phiếu' })).toBeVisible();
});

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
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
        await expect(page.locator('[data-testid="admin-bit"]').first()).toBeVisible();
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

defineShiftTests([
  {
    name: 'canned-reply table',
    path: PATH,
    signedIn: true,
    hold: 'GET /ticket-canned-replies',
    answer: (api) => withReplies(api),
    parts: (page) => ({
      table: page.locator(
        '[data-skeleton-region="canned-table"] table, [data-testid="canned-replies"] table',
      ),
    }),
    viewports: PHONE_AND_DESKTOP,
  },
]);

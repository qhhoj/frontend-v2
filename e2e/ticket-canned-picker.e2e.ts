import { cannedReply, ticketDetail } from '../src/test/community-fixtures';
import { THEMES } from '../src/theme/registry';
import { expect, list, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { applyTheme, AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { ok } from './fixtures/reply';

const STAFF_TICKET = ticketDetail({ can: { editNotes: true, markGood: true, assign: true } });
const PATH = `/tickets/${STAFF_TICKET.id}`;
const withStaffTicket = (api: FakeApi, replies = [cannedReply()]) => {
  api.signedIn = true;
  api.routes[`GET /tickets/${STAFF_TICKET.id}`] = ok(STAFF_TICKET);
  api.routes['GET /ticket-canned-replies'] = list(replies);
};

test('a handler inserts a canned reply with the placeholders filled in', async ({ page, api }) => {
  withStaffTicket(api);
  await page.goto(PATH);
  await page.getByRole('button', { name: 'Mẫu trả lời' }).click();
  await page
    .getByRole('dialog', { name: 'Chọn mẫu trả lời' })
    .getByRole('button', { name: /Đã nhận phiếu/ })
    .click();
  const reply = page.getByRole('textbox', { name: 'Trả lời' });
  await expect(reply).toHaveValue(/Chào user_01, cảm ơn bạn đã báo lỗi ở bài Trò chơi trên cây/);
  await expect(reply).toBeFocused();
});

test('the empty picker shows the quill Bit and the way to the admin screen', async ({
  page,
  api,
}) => {
  withStaffTicket(api, []);
  await page.goto(PATH);
  await page.getByRole('button', { name: 'Mẫu trả lời' }).click();
  const dialog = page.getByRole('dialog', { name: 'Chọn mẫu trả lời' });
  await expect(dialog.getByText('Chưa có mẫu trả lời nào.')).toBeVisible();
  await expect(dialog.locator('[data-testid="inline-bit"]')).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Quản lý mẫu trả lời' })).toHaveAttribute(
    'href',
    '/admin/tickets/canned',
  );
});

for (const viewport of AUDIT_VIEWPORTS)
  for (const theme of THEMES)
    test(`the open picker has no WCAG 2.1 A/AA violations in ${theme.id}, ${viewport.name}`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      withStaffTicket(api);
      await applyTheme(page, api, theme);
      await page.goto(PATH);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
      await page.getByRole('button', { name: 'Mẫu trả lời' }).click();
      await expect(
        page.getByRole('dialog', { name: 'Chọn mẫu trả lời' }).getByText('Đã nhận phiếu'),
      ).toBeVisible();
      expect(await axeViolationsIn(page)).toEqual([]);
    });

test('the open picker does not make the page scroll sideways at 375 px', async ({ page, api }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  withStaffTicket(api);
  await page.goto(PATH);
  await page.getByRole('button', { name: 'Mẫu trả lời' }).click();
  await expect(page.getByRole('dialog', { name: 'Chọn mẫu trả lời' })).toBeVisible();
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
});

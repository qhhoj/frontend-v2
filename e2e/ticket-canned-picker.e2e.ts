import { cannedReply, ticketDetail } from '../src/test/community-fixtures';
import { expect, list, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
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

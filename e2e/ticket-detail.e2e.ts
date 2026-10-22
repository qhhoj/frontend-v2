import { ticketDetail } from '../src/test/community-fixtures';
import { notificationItem } from '../src/test/notification-fixtures';
import { expect, list, streamFrame, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { ok } from './fixtures/reply';

const TICKET_ID = ticketDetail().id;
const TICKET_PATH = `/tickets/${TICKET_ID}`;
const TICKET_KEY = `GET /tickets/${TICKET_ID}`;
const STREAM_KEY = `GET /events/tickets/${TICKET_ID}`;

test('two new messages on the open ticket refetch it once and announce one count', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  api.routes[TICKET_KEY] = ok(ticketDetail());
  api.routes[STREAM_KEY] = {
    contentType: 'text/event-stream',
    raw: `retry: 600000\n\n${streamFrame('ticket-message', { type: 'ticket-message', ticketId: TICKET_ID, messageId: 'm2', open: null })}${streamFrame('ticket-message', { type: 'ticket-message', ticketId: TICKET_ID, messageId: 'm3', open: null })}`,
  };
  await page.goto(TICKET_PATH);
  await expect(page.getByTestId('ticket-live')).toHaveText('2 tin nhắn mới');
  expect(api.requestsTo(TICKET_KEY)).toHaveLength(2);
});

const OTHER_ID = '0192a000-0000-7000-8000-0000000000b2';
const EDITOR = { editNotes: true, markGood: false, assign: false, claim: false };

/** Ticket A is open; the bell holds one notification that leads to ticket B. */
function withTwoTickets(api: FakeApi) {
  const toOther = notificationItem({ path: `/tickets/${OTHER_ID}`, title: 'Phiếu B có trả lời' });
  api.signedIn = true;
  api.routes[TICKET_KEY] = ok(ticketDetail({ title: 'Phiếu A', notes: 'Ghi chú A', can: EDITOR }));
  api.routes[`GET /tickets/${OTHER_ID}`] = ok(
    ticketDetail({ id: OTHER_ID, title: 'Phiếu B', notes: 'Ghi chú B', can: EDITOR }),
  );
  api.routes['GET /notifications/unread-count'] = ok({ count: 1 });
  api.routes['GET /notifications'] = ({ url }) =>
    list(url.searchParams.get('priority') === 'high' ? [] : [toOther]);
  api.routes['POST /notifications/:id/read'] = { status: 204 };
  api.routes[`PATCH /tickets/${TICKET_ID}`] = ok({});
  api.routes[`PATCH /tickets/${OTHER_ID}`] = ok({});
}

test('back from a ticket opened from the bell saves notes to the ticket on screen', async ({
  page,
  api,
}) => {
  withTwoTickets(api);
  await page.goto(TICKET_PATH);
  await page.getByTestId('notification-bell').click();
  await page
    .getByRole('dialog', { name: 'Thông báo' })
    .locator('[data-testid="notification-row"] button')
    .first()
    .click();
  await expect(page.locator('h1')).toHaveText('Phiếu B');
  await page.goBack();
  await expect(page.locator('h1')).toHaveText('Phiếu A');
  await expect(page.locator('textarea[name="notes"]')).toHaveValue('Ghi chú A');
  await page.locator('textarea[name="notes"]').fill('Ghi chú A mới');
  await page.getByRole('button', { name: 'Lưu ghi chú' }).click();
  await expect.poll(() => api.requestsTo(`PATCH /tickets/${TICKET_ID}`).length).toBe(1);
  expect(api.requestsTo(`PATCH /tickets/${OTHER_ID}`)).toHaveLength(0);
});

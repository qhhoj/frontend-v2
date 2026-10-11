import { ticketDetail } from '../src/test/community-fixtures';
import { expect, streamFrame, test } from './fixtures/api';
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

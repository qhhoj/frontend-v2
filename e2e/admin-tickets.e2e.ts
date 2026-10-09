import { expect, streamFrame, test } from './fixtures/api';
import { AUDIT_VIEWPORTS, axeViolationsIn } from './fixtures/audit';
import { adminList, adminOk, signInAsStaff } from './fixtures/admin';
import { ticketDetail, ticketItem } from '../src/test/community-fixtures';

const PERMISSIONS = ['judge.change_ticket'];
const TICKET_ID = 't-1';
const DETAIL_KEY = `GET /tickets/${TICKET_ID}`;
const TITLE = 'Test 7 sai đáp án';

/** The queue with its one ticket open: the list stream and the open ticket's stream answer with no frames. */
function queueRoutes(api: Parameters<typeof signInAsStaff>[0], streamRaw = 'retry: 600000\n\n') {
  signInAsStaff(api, PERMISSIONS);
  api.routes['GET /tickets'] = adminList([ticketItem({ id: TICKET_ID, title: TITLE })]);
  api.routes[DETAIL_KEY] = adminOk(
    ticketDetail({
      id: TICKET_ID,
      title: TITLE,
      can: { editNotes: true, markGood: true, assign: true },
    }),
  );
  api.routes['GET /events/tickets'] = {
    contentType: 'text/event-stream',
    raw: 'retry: 600000\n\n',
  };
  api.routes[`GET /events/tickets/${TICKET_ID}`] = {
    contentType: 'text/event-stream',
    raw: streamRaw,
  };
}

for (const viewport of AUDIT_VIEWPORTS)
  test(`queue with a ticket open is accessible and fits at ${viewport.name}`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize(viewport);
    queueRoutes(api);
    await page.goto(`/admin/tickets?ticket=${TICKET_ID}`);
    await expect(page.getByTestId('queue-detail')).toContainText(TITLE);
    expect(await axeViolationsIn(page)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

test('a new message on the open ticket refetches it once', async ({ page, api }) => {
  queueRoutes(
    api,
    `retry: 600000\n\n${streamFrame('ticket-message', { type: 'ticket-message', ticketId: TICKET_ID, messageId: 'm2', open: null })}`,
  );
  await page.goto(`/admin/tickets?ticket=${TICKET_ID}`);
  await expect(page.getByTestId('queue-detail')).toContainText(TITLE);
  await expect.poll(() => api.requestsTo(DETAIL_KEY).length).toBe(2);
});

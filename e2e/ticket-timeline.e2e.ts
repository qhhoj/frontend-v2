import {
  ADMIN_USER,
  eventEntry,
  messageEntry,
  ticketDetail,
  ticketMessage,
  timelineEvent,
} from '../src/test/community-fixtures';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';
import { ok } from './fixtures/reply';

const COLAN = { id: '0192a000-0000-7000-8000-000000000905', username: 'colan', rating: null };
const HOANGANH = { id: '0192a000-0000-7000-8000-000000000906', username: 'hoanganh', rating: null };
const first = ticketMessage({ id: 'm1', createdAt: '2026-10-08T13:12:00Z' });
const reply = ticketMessage({
  id: 'm2',
  author: COLAN,
  createdAt: '2026-10-08T13:40:00Z',
  bodyHtml: '<p>Đang kiểm tra.</p>',
});
const DETAIL = ticketDetail({
  messages: [first, reply],
  messageCount: 2,
  isOpen: false,
  timeline: [
    messageEntry(first),
    eventEntry(
      timelineEvent({
        id: 'e1',
        type: 'assigned',
        actor: ADMIN_USER,
        target: COLAN,
        at: '2026-10-08T13:30:00Z',
      }),
    ),
    messageEntry(reply),
    eventEntry(
      timelineEvent({
        id: 'e2',
        type: 'unassigned',
        actor: ADMIN_USER,
        target: COLAN,
        at: '2026-10-08T13:45:00Z',
      }),
    ),
    eventEntry(
      timelineEvent({
        id: 'e3',
        type: 'assigned',
        actor: ADMIN_USER,
        target: HOANGANH,
        at: '2026-10-08T13:45:00Z',
      }),
    ),
    eventEntry(
      timelineEvent({ id: 'e4', type: 'closed', actor: HOANGANH, at: '2026-10-08T14:22:00Z' }),
    ),
  ],
});
const PATH = `/tickets/${DETAIL.id}`;
const KEY = `GET /tickets/${DETAIL.id}`;
const withTicket = (api: FakeApi) => {
  api.signedIn = true;
  api.routes[KEY] = ok(DETAIL);
};

test('a group of events opens to show each change, a lone event is a divider', async ({
  page,
  api,
}) => {
  withTicket(api);
  await page.goto(PATH);
  const thread = page.getByRole('region', { name: 'Tin nhắn' });
  await expect(thread.getByTestId('thread-counts')).toHaveText('2 tin nhắn · 4 sự kiện');
  await expect(thread.getByText('thayhung đã giao phiếu cho colan')).toBeVisible();
  const group = thread.getByTestId('ticket-event-group').first();
  await expect(group.getByText('thayhung đã giao phiếu cho hoanganh')).toBeHidden();
  await group.locator('summary').click();
  await expect(group.getByText('thayhung đã giao phiếu cho hoanganh')).toBeVisible();
  await expect(thread.getByText('hoanganh đã đóng phiếu')).toBeVisible();
});

test('the cap notice carries the hard-hat Bit', async ({ page, api }) => {
  api.signedIn = true;
  const many = Array.from({ length: 200 }, (_item, index) =>
    eventEntry(timelineEvent({ id: `e${index}`, type: index % 2 ? 'reopened' : 'closed' })),
  );
  api.routes[KEY] = ok({ ...DETAIL, timeline: [messageEntry(first), ...many] });
  await page.goto(PATH);
  await expect(page.getByText('Chỉ hiện 200 sự kiện gần nhất')).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Tin nhắn' }).locator('[data-testid="inline-bit"]'),
  ).toBeVisible();
});

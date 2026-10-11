import { describe, expect, it } from 'vitest';
import type { TicketDetail } from '@/api/types/tickets';
import {
  ADMIN_USER,
  eventEntry,
  messageEntry,
  ticketDetail,
  ticketMessage,
  timelineEvent,
} from '@/test/community-fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';

const COLAN = { id: '0192a000-0000-7000-8000-000000000905', username: 'colan', rating: null };
const HOANGANH = { id: '0192a000-0000-7000-8000-000000000906', username: 'hoanganh', rating: null };
const first = ticketMessage({ id: 'm1', createdAt: '2026-10-08T13:12:00Z' });
const reply = ticketMessage({
  id: 'm2',
  author: COLAN,
  createdAt: '2026-10-08T13:40:00Z',
  bodyHtml: '<p>Đang kiểm tra.</p>',
});
const timeline = [
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
    timelineEvent({ id: 'e4', type: 'marked-good', actor: ADMIN_USER, at: '2026-10-08T14:00:00Z' }),
  ),
];
const detailWith = (overrides: Partial<TicketDetail> = {}) =>
  ticketDetail({ messages: [first, reply], messageCount: 2, timeline, ...overrides });
async function open(detail: TicketDetail) {
  mockApi({ ...signedInViewer(), [`GET /tickets/${detail.id}`]: ok(detail) });
  const { wrapper } = await mountApp(`/tickets/${detail.id}`);
  return wrapper.get('section[aria-label="Tin nhắn"]');
}

describe('ticket thread with timeline rows', () => {
  it('hides good-contribution rows from the ticket owner', async () => {
    const thread = await open(detailWith());
    expect(thread.text()).not.toContain('đóng góp tốt');
    expect(thread.get('[data-testid="thread-counts"]').text()).toBe('2 tin nhắn · 3 sự kiện');
    expect(thread.get('[data-testid="ticket-event-group"] summary').text()).toContain('2 sự kiện');
  });
});

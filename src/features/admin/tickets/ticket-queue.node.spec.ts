import { describe, expect, it } from 'vitest';
import type { LocationQuery } from 'vue-router';
import { ticketQueryFromRoute } from '@/features/tickets/ticket-filters';
import { queueLocation, seedQueueQuery, statusOf, withStatus } from './ticket-queue';
import type { QueueStatus } from './ticket-queue';

const base = ticketQueryFromRoute({ scope: 'all', user: 'tuan_k', page: '3' });

describe('ticket queue', () => {
  it('maps open, closed and all to the backend flag, back to page 1, and reads the flag back', () => {
    expect(withStatus(base, 'open')).toMatchObject({ open: true, page: 1, user: ['tuan_k'] });
    expect(withStatus(base, 'closed')).toMatchObject({ open: false, page: 1 });
    expect(withStatus(base, 'all').open).toBeUndefined();
    const statuses: QueueStatus[] = ['open', 'closed', 'all'];
    expect(statuses.map((status) => statusOf(withStatus(base, status)))).toEqual(statuses);
  });

  it('opens on everyone’s open tickets the first time, and never overrides a filter the URL carries', () => {
    expect(seedQueueQuery({})).toEqual({ scope: 'all', open: '1' });
    expect(seedQueueQuery({ ticket: 't-1' })).toEqual({ ticket: 't-1', scope: 'all', open: '1' });
    expect(seedQueueQuery({ open: '0', scope: 'all' })).toEqual({ open: '0', scope: 'all' });
    expect(seedQueueQuery({ user: 'tuan_k' })).toEqual({ user: 'tuan_k' });
  });

  it('writes open=all when 8e writes no filter key, so a reload keeps own tickets with both states and a bare page', () => {
    const ownBoth = { own: true, open: undefined, user: [], assignee: [], page: 1 };
    const location = queueLocation(ownBoth, null);
    expect(location).toEqual({ open: 'all' });
    expect(seedQueueQuery(location as LocationQuery)).toEqual({ open: 'all' });
    expect(ticketQueryFromRoute(location as LocationQuery)).toEqual(ownBoth);
    const pageTwo = queueLocation({ ...ownBoth, page: 2 }, 't-1');
    expect(pageTwo).toEqual({ open: 'all', page: '2', ticket: 't-1' });
    expect(seedQueueQuery(pageTwo as LocationQuery)).toEqual(pageTwo);
  });
});

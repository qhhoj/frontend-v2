import { describe, expect, it } from 'vitest';
import { ticketQueryFromRoute } from '@/features/tickets/ticket-filters';
import { seedQueueQuery, statusOf, withStatus } from './ticket-queue';
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
});

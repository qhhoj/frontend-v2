import { describe, expect, it } from 'vitest';
import type { LocationQuery } from 'vue-router';
import { ticketQueryFromRoute } from '@/features/tickets/ticket-filters';
import {
  handlingPatchOf,
  isMineOnly,
  queueLocation,
  seedQueueQuery,
  statusOf,
  withMineOnly,
  withStatus,
} from './ticket-queue';
import { ticketDetail } from '@/test/community-fixtures';
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

  it('opens a problem setter on the open tickets about their problems, unless the URL already filters', () => {
    expect(seedQueueQuery({}, false)).toEqual({ scope: 'all', open: '1', about: 'mine' });
    expect(seedQueueQuery({ q: 'bitcoder' }, false)).toEqual({ q: 'bitcoder' });
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

  it('turns "my tickets" on as the viewer alone in the assignee filter, and off as no assignee filter', () => {
    const mine = withMineOnly(base, 'bitcoder', true);
    expect(mine).toMatchObject({ assignee: ['bitcoder'], page: 1 });
    expect(isMineOnly(mine, 'bitcoder')).toBe(true);
    expect(isMineOnly({ ...mine, assignee: ['bitcoder', 'user_01'] }, 'bitcoder')).toBe(false);
    expect(withMineOnly(mine, 'bitcoder', false).assignee).toEqual([]);
  });
});

describe('the "Xử lý" save', () => {
  const staff = { assign: true, editNotes: true, markGood: true, claim: true };
  const ticket = ticketDetail({
    title: 'Test 7 sai',
    notes: 'cũ',
    assignees: [{ id: 'u-1', username: 'user_01', rating: null }],
    can: staff,
  });
  const draftOf = (changes = {}) => ({
    assignees: 'user_01',
    notes: 'cũ',
    title: 'Test 7 sai',
    problem: 'hcmus41b',
    ...changes,
  });

  it('sends nothing when every field matches the ticket', () => {
    expect(handlingPatchOf(ticket, draftOf())).toBeNull();
    expect(
      handlingPatchOf(ticket, draftOf({ assignees: ' user_01, user_01 ', title: ' ' })),
    ).toBeNull();
  });

  it('sends only the changed fields, the handlers as a de-duplicated list', () => {
    expect(
      handlingPatchOf(
        ticket,
        draftOf({ assignees: 'user_02,user_01 user_02', problem: 'hcmus41c' }),
      ),
    ).toEqual({ assignees: ['user_02', 'user_01'], problem: 'hcmus41c' });
    expect(handlingPatchOf(ticket, draftOf({ assignees: '' }))).toEqual({ assignees: [] });
  });

  it('leaves out what the viewer may not change', () => {
    const handler = { ...ticket, can: { ...staff, assign: false } };
    expect(
      handlingPatchOf(handler, draftOf({ assignees: 'user_02', title: 'Khác', notes: 'mới' })),
    ).toEqual({ notes: 'mới' });
    const reader = { ...ticket, can: { ...staff, assign: false, editNotes: false } };
    expect(handlingPatchOf(reader, draftOf({ notes: 'mới' }))).toBeNull();
  });
});

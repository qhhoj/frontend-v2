import type { LocationQuery, LocationQueryRaw } from 'vue-router';
import type { TicketDetail, TicketListQuery, TicketPatch } from '@/api/types/tickets';
import { routeQueryFromFilters } from '@/features/tickets/ticket-filters';

export type QueueStatus = 'open' | 'closed' | 'all';

/** The keys of 8e's ticket-list URL format that filter the list (`?ticket=` only picks one ticket). */
const FILTER_KEYS = ['scope', 'open', 'awaiting', 'user', 'assignee'] as const;

/** Backend: `open=true` lists open tickets, `open=false` closed ones, and an unset flag lists both. */
const OPEN_FLAG: Record<QueueStatus, boolean | undefined> = {
  open: true,
  closed: false,
  all: undefined,
};

export const statusOf = (query: TicketListQuery): QueueStatus => {
  if (query.open === true) return 'open';
  return query.open === false ? 'closed' : 'all';
};

/** Switching status goes back to page 1: the other status has its own pages. */
export const withStatus = (query: TicketListQuery, status: QueueStatus): TicketListQuery => ({
  ...query,
  open: OPEN_FLAG[status],
  // Waiting for staff are open tickets only: another status drops it.
  awaiting: status === 'open' ? query.awaiting : undefined,
  page: 1,
});

/** The first visit opens on everyone's open tickets by writing 8e's own `scope=all&open=1`; a URL that already filters is left alone. */
export function seedQueueQuery(query: LocationQuery): LocationQuery {
  const hasFilter = FILTER_KEYS.some((key) => key in query);
  return hasFilter ? query : { ...query, scope: 'all', open: '1' };
}

/**
 * The queue's URL for `filters` with the open ticket kept. When 8e's format writes no filter key (own tickets with both
 * states, or a bare page), `open=all` is written: 8e reads any value but 1 and 0 as both states, and the seed then leaves
 * the URL alone on reload.
 */
export const queueLocation = (
  filters: TicketListQuery,
  ticketId: string | null,
): LocationQueryRaw => {
  const filterQuery = routeQueryFromFilters(filters);
  const hasFilter = FILTER_KEYS.some((key) => key in filterQuery);
  return {
    ...filterQuery,
    ...(hasFilter ? {} : { open: 'all' }),
    ...(ticketId ? { ticket: ticketId } : {}),
  };
};

/** The ticket shown beside the list: `?ticket=` is the only key that picks one. */
export const ticketIdOf = (query: LocationQuery): string | null => {
  const value = Array.isArray(query.ticket) ? query.ticket[0] : query.ticket;
  return value || null;
};

/** The retitle and relink a staff form asks for, only what differs from the ticket; null when nothing does. A blank code keeps the link. */
export function movePatchOf(
  ticket: Pick<TicketDetail, 'title' | 'link'>,
  draft: { title: string; problem: string },
): TicketPatch | null {
  const patch: TicketPatch = {};
  const title = draft.title.trim();
  if (title && title !== ticket.title) patch.title = title;
  const code = draft.problem.trim();
  const linked = ticket.link.type === 'problem' ? ticket.link.key : null;
  if (code && code !== linked) patch.problem = code;
  return Object.keys(patch).length ? patch : null;
}

import type { LocationQuery, LocationQueryRaw } from 'vue-router';
import type { TicketDetail, TicketListQuery, TicketPatch } from '@/api/types/tickets';
import { routeQueryFromFilters } from '@/features/tickets/ticket-filters';

export type QueueStatus = 'open' | 'closed' | 'all';

/** The keys of 8e's ticket-list URL format that filter the list (`?ticket=` only picks one ticket). */
const FILTER_KEYS = ['scope', 'open', 'awaiting', 'about', 'q', 'user', 'assignee'] as const;

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

/**
 * The first visit opens on everyone's open tickets by writing 8e's own `scope=all&open=1`; a problem setter without the
 * ticket right (`isStaff` false) opens on the open tickets about their problems (`about=mine`). A URL that already filters
 * is left alone.
 */
export function seedQueueQuery(query: LocationQuery, isStaff = true): LocationQuery {
  const hasFilter = FILTER_KEYS.some((key) => key in query);
  if (hasFilter) return query;
  return { ...query, scope: 'all', open: '1', ...(isStaff ? {} : { about: 'mine' }) };
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

/** The backend's `TICKET_ASSIGNEES_MAX`. */
export const TICKET_ASSIGNEES_MAX = 20;

/** What the "Xử lý" section edits, as typed. */
export interface HandlingDraft {
  assignees: string;
  notes: string;
  title: string;
  problem: string;
}

/** Usernames typed separated by commas or spaces, each once; unlike the list filter, the limit is the backend's 20. */
export const assigneeNamesOf = (text: string): string[] => [
  ...new Set(text.split(/[\s,]+/).filter(Boolean)),
];

const sameNames = (left: string[], right: string[]) =>
  left.length === right.length && left.every((name, index) => name === right[index]);

/** The retitle and relink, only what differs from the ticket. A blank title or code keeps it. */
function movePatchOf(
  ticket: Pick<TicketDetail, 'title' | 'link'>,
  draft: HandlingDraft,
): TicketPatch {
  const patch: TicketPatch = {};
  const title = draft.title.trim();
  if (title && title !== ticket.title) patch.title = title;
  const code = draft.problem.trim();
  const linked = ticket.link.type === 'problem' ? ticket.link.key : null;
  if (code && code !== linked) patch.problem = code;
  return patch;
}

/**
 * The one PATCH the "Xử lý" section saves: handlers, notes, title and link, only what differs from the ticket and only
 * what the viewer may change (`can.assign` for handlers, title and link; `can.editNotes` for notes). Null when nothing does.
 */
export function handlingPatchOf(
  ticket: Pick<TicketDetail, 'title' | 'link' | 'notes' | 'assignees' | 'can'>,
  draft: HandlingDraft,
): TicketPatch | null {
  const patch: TicketPatch = ticket.can.assign ? movePatchOf(ticket, draft) : {};
  const names = assigneeNamesOf(draft.assignees);
  const current = ticket.assignees.map((assignee) => assignee.username);
  if (ticket.can.assign && !sameNames(names, current)) patch.assignees = names;
  if (ticket.can.editNotes && draft.notes !== ticket.notes) patch.notes = draft.notes;
  return Object.keys(patch).length ? patch : null;
}

/** "Phiếu của tôi": the viewer is the only assignee filtered on. */
export const isMineOnly = (query: TicketListQuery, username: string) =>
  query.assignee.length === 1 && query.assignee[0] === username;

/** Turns "Phiếu của tôi" on (the viewer as the assignee filter) or off (no assignee filter), back to page 1. */
export const withMineOnly = (
  query: TicketListQuery,
  username: string,
  isOn: boolean,
): TicketListQuery => ({ ...query, assignee: isOn ? [username] : [], page: 1 });

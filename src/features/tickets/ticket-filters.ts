import type { LocationQuery, LocationQueryRaw, LocationQueryValue } from 'vue-router';
import type { TicketListQuery } from '@/api/types/tickets';
import { pageFromQuery } from '@/lib/paging';

const MAX_USERNAMES = 10;

/** Usernames typed separated by commas or spaces: trimmed, each once, at most ten. */
export const parseUsernames = (text: string): string[] =>
  [...new Set(text.split(/[\s,]+/).filter(Boolean))].slice(0, MAX_USERNAMES);

const singleValue = (value: LocationQueryValue | LocationQueryValue[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value) ?? '';

/** `open=1` lists open tickets, `open=0` closed ones; any other value (or none) lists both. */
const openFromText = (text: string): boolean | undefined => {
  if (text === '1') return true;
  if (text === '0') return false;
  return undefined;
};

/** The title or creator search; blank searches nothing and stays out of the query. */
const searchOf = (text: string): { q?: string } => (text.trim() ? { q: text.trim() } : {});

/** `about=mine` keeps tickets about the viewer's own problems; `q` searches the title or the creator's username. */
export const ticketQueryFromRoute = (query: LocationQuery): TicketListQuery => ({
  own: singleValue(query.scope) !== 'all',
  open: openFromText(singleValue(query.open)),
  ...(singleValue(query.awaiting) === '1' ? { awaiting: true } : {}),
  ...(singleValue(query.about) === 'mine' ? { aboutMine: true } : {}),
  ...searchOf(singleValue(query.q)),
  user: parseUsernames(singleValue(query.user)),
  assignee: parseUsernames(singleValue(query.assignee)),
  page: pageFromQuery(query.page),
});

/** Only the filters that differ from the defaults (own tickets, both states, page 1) go back into the URL. */
export function routeQueryFromFilters(filters: TicketListQuery): LocationQueryRaw {
  return {
    ...(filters.own ? {} : { scope: 'all' }),
    ...(filters.open === undefined ? {} : { open: filters.open ? '1' : '0' }),
    ...(filters.awaiting ? { awaiting: '1' } : {}),
    ...(filters.aboutMine ? { about: 'mine' } : {}),
    ...searchOf(filters.q ?? ''),
    ...(filters.user.length ? { user: filters.user.join(',') } : {}),
    ...(filters.assignee.length ? { assignee: filters.assignee.join(',') } : {}),
    ...(filters.page > 1 ? { page: String(filters.page) } : {}),
  };
}

/** The first six hex digits of the id, behind a hash sign: the form the board shows. */
export const shortTicketId = (id: string) => `#${id.replaceAll('-', '').slice(0, 6)}`;

import type { LocationQuery } from 'vue-router';
import type { ParticipationQuery } from '@/api/contest-editing.api';

export const KIND_FILTERS = ['', 'live', 'virtual', 'spectate'] as const;
export const STATUS_FILTERS = ['', 'valid', 'disqualified'] as const;
export const SORTS = ['', 'score'] as const;
/** backend: the participant search takes at most 30 characters. */
export const SEARCH_MAX = 30;

const pick = <Value extends string>(options: readonly Value[], raw: unknown): Value =>
  options.find((option) => option === raw) ?? options[0]!;

/** The list request from the URL (`?search=&user=&kind=&status=&sort=&page=`); unknown values fall back to no filter. */
export function participationQueryOf(query: LocationQuery): ParticipationQuery {
  const kind = pick(KIND_FILTERS, query.kind);
  const status = pick(STATUS_FILTERS, query.status);
  const sort = pick(SORTS, query.sort);
  return {
    page: Math.max(1, Number(query.page) || 1),
    user: String(query.user ?? ''),
    search: String(query.search ?? '')
      .trim()
      .slice(0, SEARCH_MAX),
    kind: kind || undefined,
    disqualified: status ? status === 'disqualified' : undefined,
    sort: sort || undefined,
  };
}

/** The filters behind "Bộ lọc" (and the exact user an add leaves), each shown as a removable chip while set. */
export const PANEL_FILTERS = ['kind', 'status', 'sort', 'user'] as const;
export type PanelFilter = (typeof PANEL_FILTERS)[number];

/** The panel filters set in the URL, in panel order. */
export function activePanelFilters(query: LocationQuery): PanelFilter[] {
  return PANEL_FILTERS.filter((name) => String(query[name] ?? '') !== '');
}

/** The URL after setting one filter (an empty value clears it); any change starts again at page 1. */
export function participationQueryWith(
  query: LocationQuery,
  patch: Record<string, string>,
): LocationQuery {
  const next: LocationQuery = { ...query, page: null };
  for (const [name, value] of Object.entries(patch)) next[name] = value || null;
  return Object.fromEntries(Object.entries(next).filter(([, value]) => value !== null));
}

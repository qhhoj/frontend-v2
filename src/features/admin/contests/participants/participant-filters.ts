import type { LocationQuery } from 'vue-router';
import type { ParticipationQuery } from '@/api/contest-editing.api';

export const KIND_FILTERS = ['', 'live', 'virtual', 'spectate'] as const;
export const STATUS_FILTERS = ['', 'valid', 'disqualified'] as const;
export const SORTS = ['', 'score'] as const;

const pick = <Value extends string>(options: readonly Value[], raw: unknown): Value =>
  options.find((option) => option === raw) ?? options[0]!;

/** The list request from the URL (`?user=&kind=&status=&sort=&page=`); unknown values fall back to no filter. */
export function participationQueryOf(query: LocationQuery): ParticipationQuery {
  const kind = pick(KIND_FILTERS, query.kind);
  const status = pick(STATUS_FILTERS, query.status);
  const sort = pick(SORTS, query.sort);
  return {
    page: Math.max(1, Number(query.page) || 1),
    user: String(query.user ?? ''),
    kind: kind || undefined,
    disqualified: status ? status === 'disqualified' : undefined,
    sort: sort || undefined,
  };
}

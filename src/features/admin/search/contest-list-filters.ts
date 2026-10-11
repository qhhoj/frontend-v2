import type { LocationQuery, LocationQueryRaw } from 'vue-router';
import type { ContestListQuery } from '@/api/types/contests';
import { valuesOf } from '@/features/problems/use-problem-filters';
import { pageFromQuery } from '@/lib/paging';
import { CONTEST_PHASE_FILTERS, SEARCH_MAX_LENGTH } from './index-search';
import type { ContestPhaseFilter } from './index-search';

/** Which of the editable contests the staff list shows: every one, those the viewer works on, or hidden ones. */
export const CONTEST_SCOPE_FILTERS = ['all', 'mine', 'hidden'] as const;
export type ContestScopeFilter = (typeof CONTEST_SCOPE_FILTERS)[number];
/** Without a sort the backend shows upcoming contests soonest first and the rest newest first. */
export const CONTEST_SORTS = ['', 'newest', 'oldest', 'name', 'users'] as const;
export type ContestSortFilter = (typeof CONTEST_SORTS)[number];

/** Everything the staff contest list reads from the address; empty strings mean "not filtered". */
export interface ContestListFilters {
  q: string;
  phase: ContestPhaseFilter;
  scope: ContestScopeFilter;
  sort: ContestSortFilter;
  /** `YYYY-MM-DD` dates from the date inputs: starts on or after `from`, and before `before`. */
  from: string;
  before: string;
  page: number;
}

const firstOf = (value: LocationQuery[string] | undefined): string => valuesOf(value)[0] ?? '';
const oneOf = <T extends string>(options: readonly T[], value: string, fallback: T): T =>
  (options as readonly string[]).includes(value) ? (value as T) : fallback;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const dateOf = (value: string) =>
  DATE.test(value) && !Number.isNaN(Date.parse(value)) ? value : '';

export function filtersFromQuery(query: LocationQuery): ContestListFilters {
  return {
    q: firstOf(query.q).slice(0, SEARCH_MAX_LENGTH),
    phase: oneOf(CONTEST_PHASE_FILTERS, firstOf(query.phase), 'all'),
    scope: oneOf(CONTEST_SCOPE_FILTERS, firstOf(query.scope), 'all'),
    sort: oneOf(CONTEST_SORTS, firstOf(query.sort), ''),
    from: dateOf(firstOf(query.from)),
    before: dateOf(firstOf(query.before)),
    page: pageFromQuery(query.page),
  };
}

export type ContestFilterPatch = Partial<Omit<ContestListFilters, 'page'>>;

/** The address after a filter change: defaults leave it, and the page starts again at 1. */
export function contestFilterQueryOf(
  current: LocationQuery,
  patch: ContestFilterPatch,
): LocationQueryRaw {
  const next: LocationQueryRaw = { ...current, page: undefined };
  for (const [field, value] of Object.entries(patch)) {
    next[field] = value === '' || value === 'all' ? undefined : value;
  }
  return next;
}

/** Local midnight of a `YYYY-MM-DD` date, as the ISO instant the backend compares start times with. */
const startOfDay = (date: string) => new Date(`${date}T00:00:00`).toISOString();

/** The `GET /contests` query of the staff list: always only contests the viewer may edit. */
export function contestListQueryOf(filters: ContestListFilters): ContestListQuery {
  return {
    editable: true,
    q: filters.q || undefined,
    phase: filters.phase === 'all' ? undefined : filters.phase,
    mine: filters.scope === 'mine' || undefined,
    visible: filters.scope === 'hidden' ? false : undefined,
    sort: filters.sort || undefined,
    startFrom: filters.from ? startOfDay(filters.from) : undefined,
    startBefore: filters.before ? startOfDay(filters.before) : undefined,
    page: filters.page,
  };
}

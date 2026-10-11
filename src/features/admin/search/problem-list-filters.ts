import type { LocationQuery, LocationQueryRaw } from 'vue-router';
import type { ProblemListQuery, ProblemSort } from '@/api/types/problems';
import { valuesOf } from '@/features/problems/use-problem-filters';
import { pageFromQuery } from '@/lib/paging';
import { SEARCH_MAX_LENGTH } from './index-search';

/** The segmented status filter of the staff problem list; `suggested` is the review queue (legacy `is_suggesting`). */
export const PROBLEM_STATUS_FILTERS = ['all', 'public', 'private', 'suggested'] as const;
export type ProblemStatusFilter = (typeof PROBLEM_STATUS_FILTERS)[number];

/** Sorts the staff list offers, newest first by default. */
export const ADMIN_PROBLEM_SORTS = [
  '-date',
  'date',
  'code',
  'name',
  '-points',
  'points',
] as const satisfies readonly ProblemSort[];
const DEFAULT_SORT: ProblemSort = '-date';
/** Only the offered sorts: another public sort in the address would leave the select showing the wrong option. */
const isAdminSort = (value: string): value is (typeof ADMIN_PROBLEM_SORTS)[number] =>
  (ADMIN_PROBLEM_SORTS as readonly string[]).includes(value);

/** The i18n key of a sort option: `date` / `-date` become `dateAsc` / `dateDesc`. */
export const sortLabelKey = (sort: ProblemSort): string =>
  sort.startsWith('-') ? `${sort.slice(1)}Desc` : `${sort}Asc`;

/** Everything the staff list reads from the address; empty strings mean "not filtered". */
export interface ProblemListFilters {
  q: string;
  status: ProblemStatusFilter;
  groupId: string;
  typeId: string;
  /** A username; the page resolves it to the id `authorId` takes. */
  author: string;
  sort: ProblemSort;
  page: number;
}

const firstOf = (value: LocationQuery[string] | undefined): string => valuesOf(value)[0] ?? '';

const statusOf = (value: LocationQuery[string] | undefined): ProblemStatusFilter => {
  const text = firstOf(value);
  return (PROBLEM_STATUS_FILTERS as readonly string[]).includes(text)
    ? (text as ProblemStatusFilter)
    : 'all';
};

export function filtersFromQuery(query: LocationQuery): ProblemListFilters {
  const sort = firstOf(query.sort);
  return {
    q: firstOf(query.q).slice(0, SEARCH_MAX_LENGTH),
    status: statusOf(query.status),
    groupId: firstOf(query.group),
    typeId: firstOf(query.type),
    author: firstOf(query.author).trim(),
    sort: isAdminSort(sort) ? sort : DEFAULT_SORT,
    page: pageFromQuery(query.page),
  };
}

/** Address keys per filter; defaults leave the address so a clean list has a clean URL. */
const ADDRESS_KEYS = {
  q: 'q',
  status: 'status',
  groupId: 'group',
  typeId: 'type',
  author: 'author',
  sort: 'sort',
} as const;
const DEFAULTS: Partial<Record<keyof typeof ADDRESS_KEYS, string>> = {
  status: 'all',
  sort: DEFAULT_SORT,
};
export type FilterPatch = Partial<Pick<ProblemListFilters, keyof typeof ADDRESS_KEYS>>;

/** The address after a filter change: the page starts again at 1. */
export function filterQueryOf(current: LocationQuery, patch: FilterPatch): LocationQueryRaw {
  const next: LocationQueryRaw = { ...current, page: undefined };
  for (const [field, value] of Object.entries(patch) as [keyof FilterPatch, string][]) {
    const isDefault = value === '' || value === DEFAULTS[field];
    next[ADDRESS_KEYS[field]] = isDefault ? undefined : value;
  }
  return next;
}

const STATUS_QUERY: Record<
  ProblemStatusFilter,
  Pick<ProblemListQuery, 'visibility' | 'suggested'>
> = {
  all: { visibility: 'all' },
  public: { visibility: 'public' },
  private: { visibility: 'private' },
  suggested: { visibility: 'all', suggested: true },
};

/** The `GET /problems` query; `authorId` is resolved from the username by the caller (undefined = no author filter). */
export function listQueryOf(
  filters: ProblemListFilters,
  authorId: string | undefined,
): ProblemListQuery {
  return {
    ...STATUS_QUERY[filters.status],
    q: filters.q || undefined,
    groupId: filters.groupId || undefined,
    typeIds: filters.typeId ? [filters.typeId] : undefined,
    authorId,
    sort: filters.sort,
    page: filters.page,
  };
}

/** The bulk visibility route takes at most this many codes. */
export const MAX_BULK_CODES = 100;

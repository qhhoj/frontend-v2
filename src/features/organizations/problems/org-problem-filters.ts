import type { LocationQuery, LocationQueryRaw } from 'vue-router';
import type { OrganizationProblemArchiveFilter } from '@/api/types/organization-problems';
import { pageFromQuery } from '@/lib/paging';
import type { OrgProblemFilters } from './org-problems.queries';

export const ARCHIVE_FILTERS = [
  'false',
  'true',
  'all',
] as const satisfies readonly OrganizationProblemArchiveFilter[];
/** Backend limits: a tag slug is `[a-z0-9-]{1,20}`, a search 1..50 characters. */
const TAG_SLUG_PATTERN = /^[a-z0-9-]{1,20}$/;
const SEARCH_MAX_LENGTH = 50;

const firstOf = (value: LocationQuery[string] | undefined): string =>
  (Array.isArray(value) ? value[0] : value) ?? '';

/** The tab's filters from its URL; anything malformed falls back to the default, never to an error. */
export function filtersFromQuery(query: LocationQuery): OrgProblemFilters {
  const tag = firstOf(query.tag);
  return {
    tag: TAG_SLUG_PATTERN.test(tag) ? tag : null,
    archived: ARCHIVE_FILTERS.find((option) => option === firstOf(query.archived)) ?? 'false',
    q: firstOf(query.q).trim().slice(0, SEARCH_MAX_LENGTH),
    page: pageFromQuery(query.page),
  };
}

/** The URL query of a filter set: defaults stay out, so a plain tab has a plain URL. */
export const routeQueryOf = (filters: OrgProblemFilters): LocationQueryRaw => ({
  ...(filters.tag ? { tag: filters.tag } : {}),
  ...(filters.archived === 'false' ? {} : { archived: filters.archived }),
  ...(filters.q ? { q: filters.q } : {}),
  ...(filters.page > 1 ? { page: String(filters.page) } : {}),
});

/** Any filter change starts again from page 1. */
export const withFilter = (
  filters: OrgProblemFilters,
  change: Partial<Omit<OrgProblemFilters, 'page'>>,
): OrgProblemFilters => ({ ...filters, ...change, page: 1 });

export type ListState = 'rows' | 'empty' | 'filteredEmpty';

/** `empty`: nothing to show without a tag or a search (the archive filter alone does not count as narrowing). */
export function listStateOf(
  total: number | undefined,
  filters: OrgProblemFilters,
): ListState | null {
  if (total === undefined) return null;
  if (total > 0) return 'rows';
  return filters.tag === null && filters.q === '' ? 'empty' : 'filteredEmpty';
}

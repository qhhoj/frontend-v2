import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { LocationQuery, LocationQueryRaw } from 'vue-router';
import { SUBMISSION_RESULT_CODES } from '@/api/types/submissions';
import type { SubmissionResult } from '@/api/types/submissions';
import { UUID, valuesOf } from '@/features/problems/use-problem-filters';

export interface SubmissionFilters {
  /** Problem code: the backend filters by code, not by name. */
  problem: string;
  /** Username. */
  user: string;
  results: SubmissionResult[];
  languageIds: string[];
  page: number;
  /** Live updates (8b); on unless the URL says `live=0`. */
  live: boolean;
}

/** Longest values the API accepts; longer ones are cut, so the whole list never answers 400. */
export const MAX_PROBLEM_CODE_LENGTH = 32;
export const MAX_USERNAME_LENGTH = 30;
const MAX_PAGE = 10_000;
const LIVE_OFF = '0';

const isResult = (value: string): value is SubmissionResult =>
  (SUBMISSION_RESULT_CODES as readonly string[]).includes(value);
const pageOf = (query: LocationQuery) => {
  const text = valuesOf(query.page)[0] ?? '';
  const page = /^\d{1,5}$/.test(text) ? Number(text) : 1;
  return page >= 1 && page <= MAX_PAGE ? page : 1;
};

/** The URL is the source of truth (filters survive reload and sharing); values the API would refuse are dropped. */
export const parseSubmissionFilters = (query: LocationQuery): SubmissionFilters => ({
  problem: (valuesOf(query.problem)[0] ?? '').slice(0, MAX_PROBLEM_CODE_LENGTH),
  user: (valuesOf(query.user)[0] ?? '').slice(0, MAX_USERNAME_LENGTH),
  results: valuesOf(query.result).filter(isResult),
  languageIds: valuesOf(query.language).filter((id) => UUID.test(id)),
  page: pageOf(query),
  live: valuesOf(query.live)[0] !== LIVE_OFF,
});

/** Defaults are left out of the URL. */
export const toSubmissionQuery = (filters: SubmissionFilters): LocationQueryRaw => ({
  problem: filters.problem || undefined,
  user: filters.user || undefined,
  result: filters.results.length ? filters.results : undefined,
  language: filters.languageIds.length ? filters.languageIds : undefined,
  page: filters.page > 1 ? String(filters.page) : undefined,
  live: filters.live ? undefined : LIVE_OFF,
});

/** Any change but a page change starts again at page 1: the old page number means nothing for new filters. */
export function withPatch(
  filters: SubmissionFilters,
  patch: Partial<SubmissionFilters>,
): SubmissionFilters {
  return { ...filters, ...patch, page: pageAfter(filters, patch) };
}

function pageAfter(filters: SubmissionFilters, patch: Partial<SubmissionFilters>): number {
  if (patch.page !== undefined) return patch.page;
  // Live updates is a view setting, not a filter: the list is the same, so the page stays.
  const changesOnlyLive = patch.live !== undefined;
  return changesOnlyLive ? filters.page : 1;
}

export function useSubmissionFilters() {
  const route = useRoute();
  const router = useRouter();
  const filters = computed(() => parseSubmissionFilters(route.query));
  const update = (patch: Partial<SubmissionFilters>) =>
    void router.replace({ query: toSubmissionQuery(withPatch(filters.value, patch)) });
  const reset = () => void router.replace({ query: {} });
  return { filters, update, reset };
}

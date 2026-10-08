import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { LocationQuery, LocationQueryRaw } from 'vue-router';
import type { ContestListQuery, ContestPhase } from '@/api/types/contests';
import { valuesOf } from '@/features/problems/use-problem-filters';

export interface ContestListFilters {
  /** Key or name, as typed; the API trims nothing, so neither do we. */
  search: string;
  isRatedOnly: boolean;
  /** One group on its own (paged), or null for the overview of all three. */
  phase: ContestPhase | null;
  page: number;
}

export const PHASE_ORDER: readonly ContestPhase[] = ['running', 'upcoming', 'ended'];
/** List B: every running contest, the next three, the last five. */
export const OVERVIEW_PAGE_SIZE: Record<ContestPhase, number> = {
  running: 100,
  upcoming: 3,
  ended: 5,
};
export const PHASE_PAGE_SIZE = 20;
const MAX_SEARCH_LENGTH = 100;
/** Counted in code points, so a cut never splits an emoji or another surrogate pair. */
const capSearch = (text: string) => Array.from(text).slice(0, MAX_SEARCH_LENGTH).join('');
const MAX_PAGE = 10_000;
const RATED_ONLY = '1';

const isPhase = (value: string | undefined): value is ContestPhase =>
  PHASE_ORDER.includes(value as ContestPhase);

function pageOf(query: LocationQuery): number {
  const text = valuesOf(query.page)[0] ?? '';
  const page = /^\d{1,5}$/.test(text) ? Number(text) : 1;
  return page >= 1 && page <= MAX_PAGE ? page : 1;
}

export function parseContestListFilters(query: LocationQuery): ContestListFilters {
  const phase = valuesOf(query.phase)[0];
  return {
    search: capSearch(valuesOf(query.search)[0] ?? ''),
    isRatedOnly: valuesOf(query.rated)[0] === RATED_ONLY,
    phase: isPhase(phase) ? phase : null,
    page: pageOf(query),
  };
}

export const toContestListLocation = (filters: ContestListFilters): LocationQueryRaw => ({
  search: filters.search || undefined,
  rated: filters.isRatedOnly ? RATED_ONLY : undefined,
  phase: filters.phase ?? undefined,
  page: filters.page > 1 ? String(filters.page) : undefined,
});

/** What one group asks: the overview shows the first page of each, a single group pages. */
export function groupQuery(filters: ContestListFilters, phase: ContestPhase): ContestListQuery {
  const isSingleGroup = filters.phase === phase;
  return {
    phase,
    search: filters.search.trim() || undefined,
    rated: filters.isRatedOnly ? true : undefined,
    page: isSingleGroup ? filters.page : 1,
    pageSize: isSingleGroup ? PHASE_PAGE_SIZE : OVERVIEW_PAGE_SIZE[phase],
  };
}

/** The URL is the source of truth; any change but a page change starts again at page 1. */
export function useContestListFilters() {
  const route = useRoute();
  const router = useRouter();
  const filters = computed(() => parseContestListFilters(route.query));
  const update = (patch: Partial<ContestListFilters>) => {
    const next = { ...filters.value, ...patch, page: patch.page ?? 1 };
    void router.replace({ query: toContestListLocation(next) });
  };
  return { filters, update };
}

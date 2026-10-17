import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { LocationQuery, LocationQueryRaw, LocationQueryValue } from 'vue-router';
import { isProblemSort } from '@/api/types/problems';
import { pageFromQuery } from '@/lib/paging';
import type { ProblemListQuery, ProblemSort } from '@/api/types/problems';

export interface ProblemFilters {
  search: string;
  groupId: string | null;
  typeIds: string[];
  pointsMin: number | null;
  pointsMax: number | null;
  /** "Ẩn bài đã giải": only problems the viewer has not solved. */
  hideSolved: boolean;
  hasEditorial: boolean;
  sort: ProblemSort | null;
}

export const NO_FILTERS: ProblemFilters = {
  search: '',
  groupId: null,
  typeIds: [],
  pointsMin: null,
  pointsMax: null,
  hideSolved: false,
  hasEditorial: false,
  sort: null,
};

/** The API accepts UUID v7 only; any other id would turn the whole list into a 400. */
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const valuesOf = (value: LocationQueryValue | LocationQueryValue[] | undefined) =>
  (Array.isArray(value) ? value : [value]).filter(
    (item): item is string => typeof item === 'string',
  );
const integerOf = (value: LocationQueryValue | LocationQueryValue[] | undefined) => {
  const text = valuesOf(value)[0];
  return text !== undefined && /^-?\d{1,9}$/.test(text) ? Number(text) : null;
};
const flagOf = (value: LocationQueryValue | LocationQueryValue[] | undefined) =>
  valuesOf(value)[0] === '1';

/** The URL is the source of truth (filters survive reload and sharing); values the API would refuse are dropped. */
export function parseProblemFilters(query: LocationQuery): ProblemFilters {
  const sort = valuesOf(query.sort)[0];
  const group = valuesOf(query.group)[0];
  return {
    search: (valuesOf(query.search)[0] ?? '').slice(0, 100),
    groupId: group !== undefined && UUID.test(group) ? group : null,
    typeIds: valuesOf(query.type).filter((id) => UUID.test(id)),
    pointsMin: integerOf(query.min),
    pointsMax: integerOf(query.max),
    hideSolved: flagOf(query.unsolved),
    hasEditorial: flagOf(query.editorial),
    sort: isProblemSort(sort) ? sort : null,
  };
}

export const toProblemQuery = (filters: ProblemFilters): LocationQueryRaw => ({
  search: filters.search || undefined,
  group: filters.groupId ?? undefined,
  type: filters.typeIds.length ? filters.typeIds : undefined,
  min: filters.pointsMin ?? undefined,
  max: filters.pointsMax ?? undefined,
  unsolved: filters.hideSolved ? '1' : undefined,
  editorial: filters.hasEditorial ? '1' : undefined,
  sort: filters.sort ?? undefined,
});

/** The filters as the list and random endpoints take them (no paging, no sort). */
export const toApiFilters = (filters: ProblemFilters) =>
  ({
    search: filters.search || undefined,
    groupId: filters.groupId ?? undefined,
    typeIds: filters.typeIds.length ? filters.typeIds : undefined,
    pointsMin: filters.pointsMin ?? undefined,
    pointsMax: filters.pointsMax ?? undefined,
    solved: filters.hideSolved ? false : undefined,
    hasEditorial: filters.hasEditorial ? true : undefined,
  }) satisfies Partial<ProblemListQuery>;

export function useProblemFilters() {
  const route = useRoute();
  const router = useRouter();
  const filters = computed(() => parseProblemFilters(route.query));
  /** The resume token: `?page=N`, 1 when absent or unusable. */
  const page = computed(() => pageFromQuery(route.query.page));
  /** A new history entry per change, so the back button undoes it. Any filter or sort change drops `page`, back to page 1. */
  const update = (patch: Partial<ProblemFilters>) =>
    void router.push({ query: toProblemQuery({ ...filters.value, ...patch }) });
  const clearAll = () => update({ ...NO_FILTERS, sort: filters.value.sort });
  return { filters, page, update, clearAll };
}

/** How many of the filters behind the phone's "Bộ lọc" button (all but search and sort) narrow the list; the points range counts once. */
export function panelFilterCount(filters: ProblemFilters): number {
  return [
    filters.groupId !== null,
    filters.typeIds.length > 0,
    filters.pointsMin !== null || filters.pointsMax !== null,
    filters.hideSolved,
    filters.hasEditorial,
  ].filter(Boolean).length;
}

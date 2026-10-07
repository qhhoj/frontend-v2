import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { LocationQuery, LocationQueryRaw, LocationQueryValue } from 'vue-router';
import { isProblemSort } from '@/api/types/problems';
import type { ProblemSort } from '@/api/types/problems';

export interface ProblemFilters {
  search: string;
  typeIds: string[];
  pointsMin: number | null;
  pointsMax: number | null;
  sort: ProblemSort | null;
}

/** The API accepts UUID v7 only; any other id would turn the whole list into a 400. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const valuesOf = (value: LocationQueryValue | LocationQueryValue[] | undefined) =>
  (Array.isArray(value) ? value : [value]).filter(
    (item): item is string => typeof item === 'string',
  );
const integerOf = (value: LocationQueryValue | LocationQueryValue[] | undefined) => {
  const text = valuesOf(value)[0];
  return text !== undefined && /^-?\d{1,9}$/.test(text) ? Number(text) : null;
};

/** The URL is the source of truth (filters survive reload and sharing); values the API would refuse are dropped. */
export function parseProblemFilters(query: LocationQuery): ProblemFilters {
  const sort = valuesOf(query.sort)[0];
  return {
    search: (valuesOf(query.search)[0] ?? '').slice(0, 100),
    typeIds: valuesOf(query.type).filter((id) => UUID.test(id)),
    pointsMin: integerOf(query.min),
    pointsMax: integerOf(query.max),
    sort: isProblemSort(sort) ? sort : null,
  };
}

export const toProblemQuery = (filters: ProblemFilters): LocationQueryRaw => ({
  search: filters.search || undefined,
  type: filters.typeIds.length ? filters.typeIds : undefined,
  min: filters.pointsMin ?? undefined,
  max: filters.pointsMax ?? undefined,
  sort: filters.sort ?? undefined,
});

export function useProblemFilters() {
  const route = useRoute();
  const router = useRouter();
  const filters = computed(() => parseProblemFilters(route.query));
  const update = (patch: Partial<ProblemFilters>) =>
    void router.replace({ query: toProblemQuery({ ...filters.value, ...patch }) });
  return { filters, update };
}

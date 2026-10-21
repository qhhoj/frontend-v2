import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  fetchPolygonLink,
  fetchPolygonStatus,
  fetchPolygonSyncs,
  fetchProblemPolygonSyncs,
} from '@/api/polygon.api';
import { fetchMyImports } from '@/api/problem-imports.api';
import { useViewerId } from '@/stores/use-viewer-id';
import { isFinal, phaseOf } from '../import/import-job';
import { polygonImportsOf } from './polygon-my-imports';

export const polygonStatusKey = (viewer: string) => ['admin', 'polygon', 'status', viewer] as const;
export const polygonLinkKey = (code: string, viewer: string) =>
  ['admin', 'polygon', 'link', code, viewer] as const;
/** `null`: every problem's history. A finished sync refreshes it with the rest of `['admin']`. */
export const polygonSyncsKey = (code: string | null, page: number, viewer: string) =>
  ['admin', 'polygon', 'syncs', code ?? '*', page, viewer] as const;

/** Read on every visit: the key may have been saved a moment ago on the settings page. */
export function usePolygonStatusQuery() {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => polygonStatusKey(viewer.value)),
    queryFn: fetchPolygonStatus,
    staleTime: 0,
  });
}

/** A problem without a link answers 404 `polygon_not_linked`: the panel then stays hidden. */
export function usePolygonLinkQuery(code: MaybeRefOrGetter<string>) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => polygonLinkKey(toValue(code), viewer.value)),
    queryFn: () => fetchPolygonLink(toValue(code)),
  });
}

/** One page of the sync history: one problem's, or every problem's when `code` is null. */
export function usePolygonSyncsQuery(
  code: MaybeRefOrGetter<string | null>,
  page: MaybeRefOrGetter<number>,
) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => polygonSyncsKey(toValue(code), toValue(page), viewer.value)),
    queryFn: () => {
      const problem = toValue(code);
      return problem === null
        ? fetchPolygonSyncs(toValue(page))
        : fetchProblemPolygonSyncs(problem, toValue(page));
    },
  });
}

/** A running import's row moves on its own; the list is not worth the job page's 2 s. */
const MY_IMPORTS_POLL_MS = 15_000;
export const myImportsKey = (viewer: string) => ['admin', 'imports', 'mine', viewer] as const;

/**
 * The viewer's Polygon imports and syncs of the last day, to return to one after leaving its page (zip uploads left out:
 * the wizard cannot show them); refreshed while one still runs.
 */
export function useMyImportsQuery() {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => myImportsKey(viewer.value)),
    queryFn: async () => polygonImportsOf(await fetchMyImports()),
    staleTime: 0,
    refetchInterval: (query) =>
      query.state.data?.some((job) => !isFinal(phaseOf(job.state))) ? MY_IMPORTS_POLL_MS : false,
  });
}

import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  fetchPolygonLink,
  fetchPolygonProblems,
  fetchPolygonStatus,
  fetchPolygonSyncs,
  fetchProblemPolygonSyncs,
} from '@/api/polygon.api';
import type { PolygonProblem } from '@/api/types/polygon';
import { useViewerId } from '@/stores/use-viewer-id';

export const polygonStatusKey = (viewer: string) => ['admin', 'polygon', 'status', viewer] as const;
export const polygonProblemsKey = (viewer: string) =>
  ['admin', 'polygon', 'problems', viewer] as const;
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

/** The whole shared list (the server caches it 60 s); search and the state chips filter it here. */
export function usePolygonProblemsQuery() {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => polygonProblemsKey(viewer.value)),
    queryFn: () => fetchPolygonProblems(),
  });
}

/** "Làm mới": asks Polygon again past the server cache and puts the answer where the list reads it. */
export function useRefreshPolygonProblems() {
  const viewer = useViewerId();
  const queryClient = useQueryClient();
  return async () => {
    const list = await fetchPolygonProblems({ refresh: true });
    queryClient.setQueryData<PolygonProblem[]>(polygonProblemsKey(viewer.value), list);
  };
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

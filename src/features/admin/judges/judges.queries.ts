import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { computed, toValue } from 'vue';
import { fetchJudges } from '@/api/judges-admin.api';
import type { Judge } from '@/api/types/judges-admin';
import { useViewerId } from '@/stores/use-viewer-id';

/** The list's search box: focus lands there when a deleted judge's row leaves. */
export const JUDGE_SEARCH_ID = 'judge-search';

/** The base of the judges key; the viewer id follows, as for every admin key. */
export const judgesKey = ['admin', 'judges'] as const;
const judgesKeyOf = (viewer: string) => [...judgesKey, viewer] as const;

/** `enabled` lets a page without `judge.change_judge` skip the request (the languages page shows no coverage then); `pollMs` keeps load, ping and online fresh while staff watch (TanStack skips hidden tabs). */
export function useJudgesQuery(
  options: { enabled?: MaybeRefOrGetter<boolean>; pollMs?: number } = {},
) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => judgesKeyOf(viewer.value)),
    queryFn: fetchJudges,
    enabled: options.enabled,
    refetchInterval: options.pollMs,
  });
}

/**
 * Writes put the server's judge into the list the board already holds, so no refetch is needed. A list that is not cached yet
 * stays uncached (the board fetches it when it opens).
 */
export function useJudgesCache() {
  const queryClient = useQueryClient();
  const viewer = useViewerId();
  const writeList = (update: (list: Judge[]) => Judge[]) =>
    queryClient.setQueryData<Judge[]>(judgesKeyOf(toValue(viewer)), (list) => list && update(list));
  return {
    replace: (judge: Judge) =>
      writeList((list) => list.map((item) => (item.name === judge.name ? judge : item))),
    add: (judge: Judge) => writeList((list) => [...list, judge]),
    remove: (name: string) => writeList((list) => list.filter((item) => item.name !== name)),
  };
}

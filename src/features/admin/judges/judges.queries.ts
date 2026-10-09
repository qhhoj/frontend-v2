import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { fetchJudges } from '@/api/judges-admin.api';
import type { Judge } from '@/api/types/judges-admin';

/** Shared with the languages coverage (Task 2). Staff-only data, so no viewer id in the key. */
export const judgesKey = ['admin', 'judges'] as const;

/** `enabled` lets a page without `judge.change_judge` skip the request (the languages page shows no coverage then). */
export const useJudgesQuery = (options: { enabled?: MaybeRefOrGetter<boolean> } = {}) =>
  useQuery({ queryKey: judgesKey, queryFn: fetchJudges, enabled: options.enabled });

/**
 * Writes put the server's judge into the list the board already holds, so no refetch is needed. A list that is not cached yet
 * stays uncached (the board fetches it when it opens).
 */
export function useJudgesCache() {
  const queryClient = useQueryClient();
  const writeList = (update: (list: Judge[]) => Judge[]) =>
    queryClient.setQueryData<Judge[]>(judgesKey, (list) => list && update(list));
  return {
    replace: (judge: Judge) =>
      writeList((list) => list.map((item) => (item.name === judge.name ? judge : item))),
    add: (judge: Judge) => writeList((list) => [...list, judge]),
  };
}

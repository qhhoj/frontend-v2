import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter, Ref } from 'vue';
import { fetchContest, fetchRanking } from '@/api/contests.api';

/** No ranking event exists yet (backend ask B4): a running board is re-read on this interval. */
export const RANKING_POLL_MS = 30_000;

export const useContestQuery = (key: MaybeRefOrGetter<string>) =>
  useQuery({
    queryKey: computed(() => ['contests', 'detail', toValue(key)]),
    queryFn: () => fetchContest(toValue(key)),
  });

export const useRankingQuery = (
  key: MaybeRefOrGetter<string>,
  withVirtual: Ref<boolean>,
  running: Ref<boolean>,
) =>
  useQuery({
    queryKey: computed(() => ['contests', 'ranking', toValue(key), { virtual: withVirtual.value }]),
    queryFn: () => fetchRanking(toValue(key), withVirtual.value),
    /** Switching the virtual toggle keeps the old board on screen (never another contest's). */
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === toValue(key) ? previous : undefined,
    refetchInterval: computed(() => (running.value ? RANKING_POLL_MS : false)),
    /** A hidden tab does not poll; it refetches when it becomes visible again. */
    refetchIntervalInBackground: false,
  });

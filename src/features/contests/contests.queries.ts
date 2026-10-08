import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter, Ref } from 'vue';
import { ApiError } from '@/api/client';
import {
  fetchContest,
  fetchContestAnnouncements,
  fetchContestStats,
  fetchContests,
  fetchCurrentParticipation,
  fetchRanking,
} from '@/api/contests.api';
import type { ContestListQuery } from '@/api/types/contests';
import { useViewerId } from '@/stores/use-viewer-id';

/** No ranking event exists yet (backend ask B4): a running board is re-read on this interval. */
export const RANKING_POLL_MS = 30_000;

/** A page of contests per viewer: after backend 4c every row carries the viewer's own state. */
export const useContestListQuery = (query: Ref<ContestListQuery>) => {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: computed(() => ['contests', 'list', viewerId.value, query.value]),
    queryFn: () => fetchContests(query.value),
    placeholderData: keepPreviousData,
  });
};

/** The detail carries a `viewer` block, so one viewer's answer never shows to another. */
export const useContestQuery = (key: MaybeRefOrGetter<string>) => {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: computed(() => ['contests', 'detail', viewerId.value, toValue(key)]),
    queryFn: () => fetchContest(toValue(key)),
  });
};

/** The viewer's current participation (virtual run number and end); asked only while in a contest. */
export const useCurrentParticipationQuery = (isEnabled: Ref<boolean>) => {
  const viewerId = useViewerId();
  return useQuery({
    enabled: isEnabled,
    queryKey: computed(() => ['contests', 'current', viewerId.value]),
    queryFn: fetchCurrentParticipation,
  });
};

export const useContestAnnouncementsQuery = (key: Ref<string>, page: Ref<number>) => {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: computed(() => ['contests', 'announcements', viewerId.value, key.value, page.value]),
    queryFn: () => fetchContestAnnouncements(key.value, page.value),
    placeholderData: keepPreviousData,
  });
};

const isForbidden = (error: unknown) => error instanceof ApiError && error.status === 403;
/** A 403 means "not open yet": the page shows that state, asking again would only repeat it. */
export const useContestStatsQuery = (key: Ref<string>) => {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: computed(() => ['contests', 'stats', viewerId.value, key.value]),
    queryFn: () => fetchContestStats(key.value),
    retry: (failures, error) => !isForbidden(error) && failures < 2,
  });
};

export const useRankingQuery = (
  key: MaybeRefOrGetter<string>,
  withVirtual: Ref<boolean>,
  running: Ref<boolean>,
) => {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: computed(() => [
      'contests',
      'ranking',
      viewerId.value,
      toValue(key),
      { virtual: withVirtual.value },
    ]),
    queryFn: () => fetchRanking(toValue(key), withVirtual.value),
    /** Switching the virtual toggle keeps the old board on screen (never another contest's). */
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[3] === toValue(key) ? previous : undefined,
    refetchInterval: computed(() => (running.value ? RANKING_POLL_MS : false)),
    /** A hidden tab does not poll; it refetches when it becomes visible again. */
    refetchIntervalInBackground: false,
  });
};

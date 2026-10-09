import { useQuery } from '@tanstack/vue-query';
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
import { useLowPowerPainted } from '@/lib/use-low-power-painted';
import { useViewerId } from '@/stores/use-viewer-id';
import { keepPreviousForSameViewer } from './keep-previous-for-viewer';

/** Every account-owned key carries the viewer id at this index: `['contests', <scope>, viewerId, ...]`. */
const VIEWER_KEY_INDEX = 2;

/** No ranking event exists yet (backend ask B4): a running board is re-read on this interval. */
export const RANKING_POLL_MS = 30_000;
/** Low-power mode (`data-low-power` on <html>) re-reads half as often. */
export const LOW_POWER_RANKING_POLL_MS = 60_000;
export const rankingPollMs = (isLowPower: boolean) =>
  isLowPower ? LOW_POWER_RANKING_POLL_MS : RANKING_POLL_MS;

/** A page of contests per viewer: after backend 4c every row carries the viewer's own state. */
export const useContestListQuery = (query: Ref<ContestListQuery>) => {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: computed(() => ['contests', 'list', viewerId.value, query.value]),
    queryFn: () => fetchContests(query.value),
    placeholderData: computed(() => keepPreviousForSameViewer(VIEWER_KEY_INDEX, viewerId.value)),
  });
};

/** The detail carries a `viewer` block, so one viewer's answer never shows to another. */
export const useContestQuery = (
  key: MaybeRefOrGetter<string>,
  isEnabled: MaybeRefOrGetter<boolean> = true,
) => {
  const viewerId = useViewerId();
  return useQuery({
    enabled: () => toValue(isEnabled),
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
    placeholderData: computed(() => keepPreviousForSameViewer(VIEWER_KEY_INDEX, viewerId.value)),
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

/** A ranking's key: `['contests', 'ranking', viewerId, contestKey, { virtual }]`. Read it only through `contestOfRankingKey`. */
const rankingKey = (viewerId: string, contestKey: string, virtual: boolean) =>
  ['contests', 'ranking', viewerId, contestKey, { virtual }] as const;
const RANKING_KEY_CONTEST_INDEX = 3;
const contestOfRankingKey = (queryKey: readonly unknown[]) => queryKey[RANKING_KEY_CONTEST_INDEX];

/** The previous board stays a placeholder only for the same contest and the same viewer. */
const keepBoardOfContest = (viewerId: string, contestKey: string) => {
  const keepForViewer = keepPreviousForSameViewer(VIEWER_KEY_INDEX, viewerId);
  return <T>(
    previous: T | undefined,
    previousQuery: { queryKey: readonly unknown[] } | undefined,
  ) =>
    previousQuery && contestOfRankingKey(previousQuery.queryKey) === contestKey
      ? keepForViewer(previous, previousQuery)
      : undefined;
};

export const useRankingQuery = (
  key: MaybeRefOrGetter<string>,
  withVirtual: Ref<boolean>,
  running: Ref<boolean>,
) => {
  const viewerId = useViewerId();
  const isLowPower = useLowPowerPainted();
  return useQuery({
    queryKey: computed(() => rankingKey(viewerId.value, toValue(key), withVirtual.value)),
    queryFn: () => fetchRanking(toValue(key), withVirtual.value),
    /** Switching the virtual toggle keeps the old board on screen (never another contest's or viewer's). */
    placeholderData: computed(() => keepBoardOfContest(viewerId.value, toValue(key))),
    refetchInterval: computed(() => (running.value ? rankingPollMs(isLowPower.value) : false)),
    /** A hidden tab does not poll; it refetches when it becomes visible again. */
    refetchIntervalInBackground: false,
  });
};

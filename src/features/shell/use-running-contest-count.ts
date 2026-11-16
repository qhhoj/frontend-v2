import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { fetchContests } from '@/api/contests.api';
import type { ContestListItem } from '@/api/types/contests';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useIsFirstNavigationPending } from '@/router/first-navigation';
import { useViewerId } from '@/stores/use-viewer-id';

/** The rail's "N đang thi" is a hint, not a clock: read once per load, again on a return after a minute. */
export const RAIL_CONTEST_STALE_MS = 60_000;

/** True once the session has answered and where the rail is drawn (not on a phone): the rail's contest reads wait for it. */
export function useIsRailAsked() {
  const isSessionPending = useIsFirstNavigationPending();
  const isPhone = useMediaQuery(PHONE_QUERY);
  return computed(() => !isSessionPending.value && !isPhone.value);
}

/**
 * The contests this viewer can see that are running now: a one-row page of `phase=running`, its total and its first
 * item (the one the rail's "next contest" block shows). One request, under the real viewer.
 */
export function useRunningContests() {
  const viewerId = useViewerId();
  const isAsked = useIsRailAsked();
  const query = useQuery({
    queryKey: computed(() => ['contests', 'running-count', viewerId.value]),
    queryFn: async (): Promise<{ total: number; first: ContestListItem | null }> => {
      const page = await fetchContests({ phase: 'running', pageSize: 1 });
      return { total: page.meta.total, first: page.items[0] ?? null };
    },
    enabled: isAsked,
    staleTime: RAIL_CONTEST_STALE_MS,
  });
  return {
    count: computed(() => query.data.value?.total ?? 0),
    first: computed(() => query.data.value?.first ?? null),
    isReady: computed(() => query.isSuccess.value),
  };
}

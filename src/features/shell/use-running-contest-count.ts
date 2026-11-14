import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { fetchContests } from '@/api/contests.api';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useIsFirstNavigationPending } from '@/router/first-navigation';
import { useViewerId } from '@/stores/use-viewer-id';

/** The rail's "N đang thi" is a hint, not a clock: read once per load, again on a return after a minute. */
const RUNNING_COUNT_STALE_MS = 60_000;

/**
 * How many contests this viewer can see are running now (a one-row page of `phase=running`, its total). Asked once the
 * session has answered (one request, under the real viewer) and only where the rail is drawn (not on a phone).
 */
export function useRunningContestCount() {
  const viewerId = useViewerId();
  const isSessionPending = useIsFirstNavigationPending();
  const isPhone = useMediaQuery(PHONE_QUERY);
  const query = useQuery({
    queryKey: computed(() => ['contests', 'running-count', viewerId.value]),
    queryFn: async () => (await fetchContests({ phase: 'running', pageSize: 1 })).meta.total,
    enabled: () => !isSessionPending.value && !isPhone.value,
    staleTime: RUNNING_COUNT_STALE_MS,
  });
  return computed(() => query.data.value ?? 0);
}

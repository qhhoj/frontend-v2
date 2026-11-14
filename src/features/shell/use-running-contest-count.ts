import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { fetchContests } from '@/api/contests.api';
import { useViewerId } from '@/stores/use-viewer-id';

/** The rail's "N đang thi" is a hint, not a clock: a minute old is fresh enough. */
const RUNNING_COUNT_STALE_MS = 60_000;

/** How many contests this viewer can see are running now (a one-row page of `phase=running`, its total). */
export function useRunningContestCount() {
  const viewerId = useViewerId();
  const query = useQuery({
    queryKey: computed(() => ['contests', 'running-count', viewerId.value]),
    queryFn: async () => (await fetchContests({ phase: 'running', pageSize: 1 })).meta.total,
    staleTime: RUNNING_COUNT_STALE_MS,
  });
  return computed(() => query.data.value ?? 0);
}

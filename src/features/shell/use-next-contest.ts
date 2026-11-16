import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { fetchContests } from '@/api/contests.api';
import type { ContestListItem } from '@/api/types/contests';
import { useViewerId } from '@/stores/use-viewer-id';
import {
  RAIL_CONTEST_STALE_MS,
  useIsRailAsked,
  useRunningContests,
} from './use-running-contest-count';

export interface NextContest {
  contest: ContestListItem;
  phase: 'running' | 'upcoming';
}

/**
 * What the rail says about contests: how many run now, and the one to point at: the first running contest, else the
 * first upcoming one (`phase=upcoming` is ordered by start time, earliest first). The upcoming page is asked only
 * when the running read has answered with none, so a rail with a running contest sends one request.
 */
export function useNextContest() {
  const running = useRunningContests();
  const viewerId = useViewerId();
  const isAsked = useIsRailAsked();
  const upcoming = useQuery({
    queryKey: computed(() => ['contests', 'upcoming-next', viewerId.value]),
    queryFn: async () => (await fetchContests({ phase: 'upcoming', pageSize: 1 })).items[0] ?? null,
    enabled: () => isAsked.value && running.isReady.value && running.count.value === 0,
    staleTime: RAIL_CONTEST_STALE_MS,
  });
  const next = computed<NextContest | null>(() => {
    if (running.first.value) return { contest: running.first.value, phase: 'running' };
    if (running.count.value === 0 && upcoming.data.value) {
      return { contest: upcoming.data.value, phase: 'upcoming' };
    }
    return null;
  });
  return { runningCount: running.count, next };
}

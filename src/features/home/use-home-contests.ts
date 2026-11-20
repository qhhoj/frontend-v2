import { computed, ref } from 'vue';
import type { ContestListQuery } from '@/api/types/contests';
import { useRunningContestsQuery } from '@/features/community/community.queries';
import { useCurrentContest } from '@/features/contests/bar/use-current-contest';
import { useContestListQuery } from '@/features/contests/contests.queries';
import { useNow } from '@/lib/use-now';
import { homePlate, plateKeyOf } from './home-contests';

/** The rows of the contest list under the plate; one more of each is asked, because the plate takes one. */
const MAX_ROWS = 3;
/** How often the clock is read again, in milliseconds. */
const CLOCK_INTERVAL = 30_000;

/**
 * The home's contests, read once by the page: the plate (see `homePlate`) and the other running and coming contests.
 * The viewer's own run comes from the shell's query (`GET /contests/current`), so it adds no request.
 */
export function useHomeContests() {
  const { current, isPending: isCurrentPending } = useCurrentContest();
  const running = useRunningContestsQuery(MAX_ROWS + 1);
  const upcoming = useContestListQuery(
    ref<ContestListQuery>({ phase: 'upcoming', pageSize: MAX_ROWS + 1 }),
  );
  const now = useNow(CLOCK_INTERVAL);
  const runningItems = computed(() => running.data.value?.items ?? []);
  const upcomingItems = computed(() => upcoming.data.value?.items ?? []);
  const plate = computed(() =>
    homePlate(current.value, runningItems.value, upcomingItems.value, now.value),
  );
  const others = (items: typeof runningItems) =>
    computed(() =>
      items.value.filter((item) => item.key !== plateKeyOf(plate.value)).slice(0, MAX_ROWS),
    );
  return {
    plate,
    otherRunning: others(runningItems),
    otherUpcoming: others(upcomingItems),
    isPending: computed(
      () => isCurrentPending.value || running.isPending.value || upcoming.isPending.value,
    ),
    error: computed(() => running.error.value ?? upcoming.error.value),
    refetch: () => {
      void running.refetch();
      void upcoming.refetch();
    },
  };
}

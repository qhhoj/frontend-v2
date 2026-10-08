import { useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import type { ContestListQuery } from '@/api/types/contests';
import { fetchHome } from '@/api/home.api';
import { useContestListQuery } from '@/features/contests/contests.queries';
import { useViewerId } from '@/stores/use-viewer-id';

/** Recent comments are filtered by what the viewer may read. */
export const useHomeQuery = () => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['home', viewer.value]),
    queryFn: fetchHome,
  });
};

/** Running contests, most recently started first (the API sorts them so); shares the contest list's cache. */
export const useRunningContestsQuery = (count: number) =>
  useContestListQuery(ref<ContestListQuery>({ phase: 'running', pageSize: count }));

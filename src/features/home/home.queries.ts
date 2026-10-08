import { useQuery } from '@tanstack/vue-query';
import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchSubmissions } from '@/api/submissions.api';
import type { ContestListQuery } from '@/api/types/contests';
import { useContestListQuery } from '@/features/contests/contests.queries';

export const useRecentSubmissionsQuery = (username: MaybeRefOrGetter<string>) => {
  const query = computed(() => ({ user: toValue(username), pageSize: 4 }));
  return useQuery({
    queryKey: computed(() => ['submissions', 'list', query.value]),
    queryFn: () => fetchSubmissions(query.value),
    select: (result) => result.items,
  });
};

/** The API sorts running contests by `startTime` descending, so this is the most recently started one. */
const RUNNING: ContestListQuery = { phase: 'running', pageSize: 1 };
export const useRunningContestQuery = () => {
  const query = useContestListQuery(ref(RUNNING));
  const contest = computed(() => query.data.value?.items[0] ?? null);
  return { ...query, data: contest };
};

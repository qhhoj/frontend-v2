import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchContests } from '@/api/contests.api';
import { fetchSubmissions } from '@/api/submissions.api';

export const useRecentSubmissionsQuery = (username: MaybeRefOrGetter<string>) => {
  const query = computed(() => ({ user: toValue(username), pageSize: 4 }));
  return useQuery({
    queryKey: computed(() => ['submissions', 'list', query.value]),
    queryFn: () => fetchSubmissions(query.value),
    select: (result) => result.items,
  });
};

/** The API sorts running contests by `startTime` descending, so this is the most recently started one. */
const RUNNING = { phase: 'running', pageSize: 1 } as const;
export const useRunningContestQuery = () =>
  useQuery({
    queryKey: ['contests', 'list', RUNNING],
    queryFn: () => fetchContests(RUNNING),
    select: (result) => result.items[0] ?? null,
  });

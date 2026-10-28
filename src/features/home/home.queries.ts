import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchSubmissions } from '@/api/submissions.api';

/** The newest submissions of the user: the card shows the first three, "Tiếp tục" scans all of them. */
const RECENT_SUBMISSIONS = 10;
export const useRecentSubmissionsQuery = (username: MaybeRefOrGetter<string>) => {
  const query = computed(() => ({ user: toValue(username), pageSize: RECENT_SUBMISSIONS }));
  return useQuery({
    queryKey: computed(() => ['submissions', 'list', query.value]),
    queryFn: () => fetchSubmissions(query.value),
    select: (result) => result.items,
  });
};

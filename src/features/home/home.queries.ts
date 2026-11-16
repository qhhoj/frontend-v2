import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchProblems } from '@/api/problems.api';
import { fetchSubmissions } from '@/api/submissions.api';
import { useViewerId } from '@/stores/use-viewer-id';

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

/** "Bài của tôi": the problems the viewer may edit. Unfinished ones are asked on their own so they come first however many problems there are. */
const MY_PROBLEMS_PAGE = 6;
export const useMyProblemsQuery = (enabled: MaybeRefOrGetter<boolean>) => {
  const viewerId = useViewerId();
  const list = (status?: 'unfinished') =>
    fetchProblems({
      editable: true,
      visibility: 'all',
      status,
      sort: '-date',
      pageSize: MY_PROBLEMS_PAGE,
    });
  return useQuery({
    queryKey: computed(() => ['problems', 'mine-home', viewerId.value]),
    enabled: computed(() => toValue(enabled)),
    queryFn: async () => {
      const [unfinished, recent] = await Promise.all([list('unfinished'), list()]);
      const seen = new Set(unfinished.items.map((problem) => problem.code));
      return [
        ...unfinished.items,
        ...recent.items.filter((problem) => !seen.has(problem.code)),
      ].slice(0, MY_PROBLEMS_PAGE);
    },
  });
};

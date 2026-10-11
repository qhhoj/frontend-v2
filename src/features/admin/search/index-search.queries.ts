import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import type { Ref } from 'vue';
import { fetchAdminProblems } from '@/api/admin-index.api';
import { lookupUser } from '@/api/admin-common.api';
import type { ProblemListQuery } from '@/api/types/problems';
import { PROBLEM_INDEX_KEY } from '../problems/problem-editing.queries';
import { fetchContests } from '@/api/contests.api';
import type { ContestListQuery } from '@/api/types/contests';
import { CONTEST_INDEX_KEY } from '../contests/contest-editing.queries';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import { INDEX_PAGE_SIZE } from './index-search';

/** Keys start with `'admin'` and carry the viewer, because what an account may see differs per account. */
export function useAdminProblemSearchQuery(query: Ref<ProblemListQuery>, isReady: Ref<boolean>) {
  const viewerId = useViewerId();
  const locale = useLocaleStore();
  return useQuery({
    queryKey: computed(() => [...PROBLEM_INDEX_KEY, viewerId.value, locale.locale, query.value]),
    queryFn: () =>
      fetchAdminProblems({ ...query.value, pageSize: INDEX_PAGE_SIZE, lang: locale.locale }),
    enabled: isReady,
    placeholderData: keepPreviousData,
  });
}

/** The author filter's username as a user id; a 404 means no such user (the list then shows nothing). */
export function useAuthorIdQuery(username: Ref<string>) {
  return useQuery({
    queryKey: computed(() => ['admin', 'user-lookup', username.value]),
    queryFn: async () => (await lookupUser(username.value)).id,
    enabled: computed(() => username.value !== ''),
    retry: false,
    staleTime: Infinity,
  });
}

export function useAdminContestSearchQuery(query: Ref<ContestListQuery>) {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: computed(() => [...CONTEST_INDEX_KEY, viewerId.value, query.value]),
    queryFn: () => fetchContests({ ...query.value, pageSize: INDEX_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
}

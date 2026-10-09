import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import type { Ref } from 'vue';
import { fetchAdminProblems } from '@/api/admin-index.api';
import { fetchContests } from '@/api/contests.api';
import type { ContestPhase } from '@/api/types/contests';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import { INDEX_PAGE_SIZE } from './index-search';

/** Keys start with `'admin'` and carry the viewer, because what an account may see differs per account. */
export function useAdminProblemSearchQuery(search: Ref<string>, page: Ref<number>) {
  const viewerId = useViewerId();
  const locale = useLocaleStore();
  return useQuery({
    queryKey: computed(() => [
      'admin',
      'index',
      'problems',
      viewerId.value,
      locale.locale,
      search.value,
      page.value,
    ]),
    queryFn: () =>
      fetchAdminProblems({
        page: page.value,
        pageSize: INDEX_PAGE_SIZE,
        lang: locale.locale,
        q: search.value,
      }),
    placeholderData: keepPreviousData,
  });
}

export function useAdminContestSearchQuery(
  search: Ref<string>,
  phase: Ref<ContestPhase | null>,
  page: Ref<number>,
) {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: computed(() => [
      'admin',
      'index',
      'contests',
      viewerId.value,
      search.value,
      phase.value,
      page.value,
    ]),
    queryFn: () =>
      fetchContests({
        q: search.value || undefined,
        phase: phase.value ?? undefined,
        page: page.value,
        pageSize: INDEX_PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });
}

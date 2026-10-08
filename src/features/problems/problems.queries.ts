import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import type { Ref } from 'vue';
import { fetchProblem, fetchProblemMeta, fetchProblems } from '@/api/problems.api';
import type { StatementLanguage } from '@/api/types/problems';
import { useSessionStore } from '@/stores/session.store';
import type { ProblemFilters } from './use-problem-filters';

/** Types, groups and languages change rarely. */
export const useProblemMetaQuery = () =>
  useQuery({ queryKey: ['problems', 'meta'], queryFn: fetchProblemMeta, staleTime: 10 * 60_000 });

export const PROBLEM_PAGE_SIZE = 50;

export const useProblemListQuery = (filters: Ref<ProblemFilters>, lang: Ref<StatementLanguage>) =>
  useInfiniteQuery({
    queryKey: computed(() => ['problems', 'list', filters.value, lang.value]),
    queryFn: ({ pageParam }) =>
      fetchProblems({
        ...filters.value,
        lang: lang.value,
        page: pageParam,
        pageSize: PROBLEM_PAGE_SIZE,
      }),
    initialPageParam: 1,
    /** The table stays mounted (and focused) while a new sort or filter loads. */
    placeholderData: keepPreviousData,
    getNextPageParam: ({ meta }) =>
      meta.page * meta.pageSize < (meta.total ?? 0) ? meta.page + 1 : undefined,
  });

const ANONYMOUS = 'anonymous';
const VIEWER_KEY_INDEX = 2;
const CODE_KEY_INDEX = 3;

/**
 * One problem in one statement language, per viewer (the detail carries the viewer's own status and contest).
 * A language switch keeps the old statement on screen while the other loads; another problem or another
 * viewer never does, so one problem's header never sits under another problem's address.
 */
export const useProblemQuery = (code: Ref<string>, lang: Ref<StatementLanguage>) => {
  const session = useSessionStore();
  const viewerId = computed(() => session.user?.id ?? ANONYMOUS);
  return useQuery({
    queryKey: computed(() => ['problems', 'detail', viewerId.value, code.value, lang.value]),
    queryFn: () => fetchProblem(code.value, lang.value),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[VIEWER_KEY_INDEX] === viewerId.value &&
      previousQuery.queryKey[CODE_KEY_INDEX] === code.value
        ? previous
        : undefined,
  });
};

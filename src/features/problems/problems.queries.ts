import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import type { Ref } from 'vue';
import { fetchProblemMeta, fetchProblems } from '@/api/problems.api';
import type { StatementLanguage } from '@/api/types/problems';
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

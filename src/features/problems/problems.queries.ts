import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import { fetchEditorial, fetchProblem, fetchProblemMeta, fetchProblems } from '@/api/problems.api';
import type { StatementLanguage } from '@/api/types/problems';
import { useViewerId } from '@/stores/use-viewer-id';
import { toApiFilters } from './use-problem-filters';
import type { ProblemFilters } from './use-problem-filters';

/** Types, groups and languages change rarely. */
export const useProblemMetaQuery = () =>
  useQuery({ queryKey: ['problems', 'meta'], queryFn: fetchProblemMeta, staleTime: 10 * 60_000 });

export const PROBLEM_PAGE_SIZE = 50;

/** One numbered page of the list; the previous page stays on screen while the next loads. */
export const useProblemListQuery = (
  filters: Ref<ProblemFilters>,
  lang: Ref<StatementLanguage>,
  page: Ref<number>,
) =>
  useQuery({
    queryKey: computed(() => ['problems', 'list', filters.value, lang.value, page.value]),
    queryFn: () =>
      fetchProblems({
        ...toApiFilters(filters.value),
        sort: filters.value.sort ?? undefined,
        lang: lang.value,
        page: page.value,
        pageSize: PROBLEM_PAGE_SIZE,
      }),
    /** The table stays mounted (and focused) while a new page, sort or filter loads. */
    placeholderData: keepPreviousData,
  });

const VIEWER_KEY_INDEX = 2;
const CODE_KEY_INDEX = 3;

/**
 * Keeps the previous answer on screen only while the viewer and the problem stay the same: another problem
 * or another viewer never shows it. Both problem keys are `[prefix, kind, viewer, code, lang]`.
 */
const keepForSameProblem = <Data>(
  previous: Data | undefined,
  previousQuery: { queryKey: readonly unknown[] } | undefined,
  viewerId: string,
  code: string,
): Data | undefined =>
  previousQuery?.queryKey[VIEWER_KEY_INDEX] === viewerId &&
  previousQuery.queryKey[CODE_KEY_INDEX] === code
    ? previous
    : undefined;

/**
 * One problem in one statement language, per viewer (the detail carries the viewer's own status and contest).
 * A language switch keeps the old statement on screen while the other loads; another problem or another
 * viewer never does, so one problem's header never sits under another problem's address.
 * `enabled` lets a page that only knows the code later (a submission's problem) wait for it.
 */
export const useProblemQuery = (
  code: Ref<string>,
  lang: Ref<StatementLanguage>,
  enabled: Ref<boolean> = ref(true),
) => {
  const viewerId = useViewerId();
  return useQuery({
    enabled,
    queryKey: computed(() => ['problems', 'detail', viewerId.value, code.value, lang.value]),
    queryFn: () => fetchProblem(code.value, lang.value),
    placeholderData: (previous, previousQuery) =>
      keepForSameProblem(previous, previousQuery, viewerId.value, code.value),
  });
};

/** The editorial of one problem in one language, per viewer. Mounted only while its tab is selected. */
export const useEditorialQuery = (code: Ref<string>, lang: Ref<StatementLanguage>) => {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: computed(() => ['problems', 'editorial', viewerId.value, code.value, lang.value]),
    queryFn: () => fetchEditorial(code.value, lang.value),
    placeholderData: (previous, previousQuery) =>
      keepForSameProblem(previous, previousQuery, viewerId.value, code.value),
  });
};

import { useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import type { MaybeRefOrGetter, Ref } from 'vue';
import { fetchEditorial, fetchProblem, fetchProblemMeta, fetchProblems } from '@/api/problems.api';
import type { StatementLanguage } from '@/api/types/problems';
import { keepPreviousForSameViewer } from '@/features/contests/keep-previous-for-viewer';
import { useViewerId } from '@/stores/use-viewer-id';
import { toApiFilters } from './use-problem-filters';
import type { ProblemFilters } from './use-problem-filters';

/** Types, groups and languages change rarely. */
export const useProblemMetaQuery = (options: { enabled?: MaybeRefOrGetter<boolean> } = {}) =>
  useQuery({
    queryKey: ['problems', 'meta'],
    queryFn: fetchProblemMeta,
    staleTime: 10 * 60_000,
    enabled: options.enabled,
  });

export const PROBLEM_PAGE_SIZE = 50;

/** Every problem key carries the viewer id at this index: `['problems', <kind>, viewerId, ...]`. */
const VIEWER_KEY_INDEX = 2;

/**
 * One numbered page of the list, per viewer (each row carries the viewer's own solved mark); the previous page
 * stays on screen while the next loads, but never one another viewer loaded.
 */
export const useProblemListQuery = (
  filters: Ref<ProblemFilters>,
  lang: Ref<StatementLanguage>,
  page: Ref<number>,
) => {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: computed(() => [
      'problems',
      'list',
      viewerId.value,
      filters.value,
      lang.value,
      page.value,
    ]),
    queryFn: () =>
      fetchProblems({
        ...toApiFilters(filters.value),
        sort: filters.value.sort ?? undefined,
        lang: lang.value,
        page: page.value,
        pageSize: PROBLEM_PAGE_SIZE,
      }),
    /** The table stays mounted (and focused) while a new page, sort or filter loads. */
    placeholderData: computed(() => keepPreviousForSameViewer(VIEWER_KEY_INDEX, viewerId.value)),
  });
};

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

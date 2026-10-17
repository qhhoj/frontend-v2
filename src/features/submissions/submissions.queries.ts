import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter, Ref } from 'vue';
import { fetchContestBestSubmissions } from '@/api/contests.api';
import {
  fetchBestSubmissions,
  fetchSubmission,
  fetchSubmissionSource,
  fetchSubmissionStats,
} from '@/api/submissions.api';
import { useViewerId } from '@/stores/use-viewer-id';
import {
  SUBMISSION_PAGE_SIZE,
  fetchScopePage,
  keepsPreviousRows,
  scopeApiQuery,
  scopeQueryKey,
} from './list/submission-scope';
import type { SubmissionScope } from './list/submission-scope';
import type { SubmissionFilters } from './use-submission-filters';

/** The server caches the stats for 30 s: polling faster would only read the same answer. */
const STATS_REFRESH_MS = 30_000;

/** One submission row per viewer: what a viewer may see of it (cases, source) depends on who asks. */
export const useSubmissionQuery = (id: Ref<string>) => {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: computed(() => ['submissions', 'detail', viewerId.value, id.value]),
    queryFn: () => fetchSubmission(id.value),
  });
};

/** The source of one submission per viewer. The submission page mounts it once the detail is known (a 403 would repeat); the diff page deliberately fires detail and source together, so a forbidden side costs two doomed requests. */
export const useSubmissionSourceQuery = (id: Ref<string>) => {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: computed(() => ['submissions', 'source', viewerId.value, id.value]),
    queryFn: () => fetchSubmissionSource(id.value),
  });
};

/**
 * One page of a scope's submission list (see `list/submission-scope.ts`). `enabled` holds it until the viewer may ask
 * (an anonymous viewer's tab, an organization outsider, a contest visitor on the own-only list).
 */
export const useScopedSubmissionListQuery = (
  scope: MaybeRefOrGetter<SubmissionScope>,
  filters: Ref<SubmissionFilters>,
  enabled: MaybeRefOrGetter<boolean> = true,
) => {
  const viewerId = useViewerId();
  /** What reaches the API: `live` is not part of it, so toggling Live updates never refetches. */
  const apiQuery = computed(() => scopeApiQuery(toValue(scope), filters.value));
  const queryKey = computed(() => scopeQueryKey(toValue(scope), viewerId.value, apiQuery.value));
  return useQuery({
    enabled: () => toValue(enabled),
    queryKey,
    queryFn: () => fetchScopePage(toValue(scope), apiQuery.value),
    /** The table stays mounted while the next page or filter of the same list loads. */
    placeholderData: (previous, previousQuery) =>
      keepsPreviousRows(previousQuery?.queryKey, queryKey.value) ? previous : undefined,
  });
};

/** One page of a problem's best submissions per viewer (what a viewer may see depends on who asks). */
export const useBestSubmissionsQuery = (code: Ref<string>, page: Ref<number>) => {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: computed(() => ['submissions', 'best', viewerId.value, code.value, page.value]),
    queryFn: () =>
      fetchBestSubmissions(code.value, { page: page.value, pageSize: SUBMISSION_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
};

/** One page of a contest problem's best submissions per viewer (the ranking's freeze and visibility depend on who asks). */
export const useContestBestSubmissionsQuery = (
  key: Ref<string>,
  code: Ref<string>,
  page: Ref<number>,
) => {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: computed(() => [
      'submissions',
      'contest-best',
      viewerId.value,
      key.value,
      code.value,
      page.value,
    ]),
    queryFn: () =>
      fetchContestBestSubmissions(key.value, code.value, {
        page: page.value,
        pageSize: SUBMISSION_PAGE_SIZE,
      }),
    /** Another page of the same problem keeps its rows on screen; another problem or viewer never does. */
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === viewerId.value &&
      previousQuery.queryKey[3] === key.value &&
      previousQuery.queryKey[4] === code.value
        ? previous
        : undefined,
  });
};

/**
 * Today's numbers for the list's strip: public, polled in the background (a failed poll keeps the last numbers).
 * `isEnabled` false (a list that shows no stats) never asks.
 */
export const useSubmissionStatsQuery = (isEnabled: MaybeRefOrGetter<boolean> = true) =>
  useQuery({
    enabled: computed(() => toValue(isEnabled)),
    queryKey: ['submissions', 'stats'],
    queryFn: fetchSubmissionStats,
    refetchInterval: STATS_REFRESH_MS,
    placeholderData: keepPreviousData,
  });

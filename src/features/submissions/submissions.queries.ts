import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import {
  fetchSubmission,
  fetchSubmissionSource,
  fetchSubmissionStats,
  fetchSubmissions,
} from '@/api/submissions.api';
import { useViewerId } from '@/stores/use-viewer-id';
import type { SubmissionFilters } from './use-submission-filters';

export const SUBMISSION_PAGE_SIZE = 50;
/** The server caches the stats for 30 s: polling faster would only read the same answer. */
const STATS_REFRESH_MS = 30_000;

/** The list filters as the API takes them (`live` is a view setting and stays out). */
export const submissionListApiQuery = (filters: SubmissionFilters) => ({
  problem: filters.problem || undefined,
  user: filters.user || undefined,
  result: filters.results.length ? filters.results : undefined,
  language: filters.languageIds.length ? filters.languageIds : undefined,
  page: filters.page,
  pageSize: SUBMISSION_PAGE_SIZE,
});

/** One submission row per viewer: what a viewer may see of it (cases, source) depends on who asks. */
export const useSubmissionQuery = (id: Ref<string>) => {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: computed(() => ['submissions', 'detail', viewerId.value, id.value]),
    queryFn: () => fetchSubmission(id.value),
  });
};

/** The source of one submission per viewer. Mounted only once the detail is known (its 403 would repeat). */
export const useSubmissionSourceQuery = (id: Ref<string>) => {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: computed(() => ['submissions', 'source', viewerId.value, id.value]),
    queryFn: () => fetchSubmissionSource(id.value),
  });
};

/**
 * One page of the submission list per viewer (what a viewer may see depends on who asks). It shares the
 * `['submissions', 'list']` prefix with Home's recent submissions, so a finished submission refreshes both.
 * `enabled` keeps an anonymous viewer's tab from asking for a list it would get a 401 for.
 */
export const useSubmissionListQuery = (
  filters: Ref<SubmissionFilters>,
  enabled: Ref<boolean> = ref(true),
) => {
  const viewerId = useViewerId();
  /** What reaches the API: `live` is not part of it, so toggling Live updates never refetches. */
  const apiQuery = computed(() => submissionListApiQuery(filters.value));
  return useQuery({
    enabled,
    queryKey: computed(() => ['submissions', 'list', viewerId.value, apiQuery.value]),
    queryFn: () => fetchSubmissions(apiQuery.value),
    /** The table stays mounted while the next page or filter loads. */
    placeholderData: keepPreviousData,
  });
};

/** Today's numbers for the list's strip: public, polled in the background (a failed poll keeps the last numbers). */
export const useSubmissionStatsQuery = () =>
  useQuery({
    queryKey: ['submissions', 'stats'],
    queryFn: fetchSubmissionStats,
    refetchInterval: STATS_REFRESH_MS,
    placeholderData: keepPreviousData,
  });

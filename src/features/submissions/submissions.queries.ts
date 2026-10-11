import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import { fetchContestSubmissions } from '@/api/contests.api';
import { fetchOrganizationSubmissions } from '@/api/organizations.api';
import {
  fetchBestSubmissions,
  fetchSubmission,
  fetchSubmissionSource,
  fetchSubmissionStats,
  fetchSubmissions,
} from '@/api/submissions.api';
import { useViewerId } from '@/stores/use-viewer-id';
import { STATUS_GROUP_STATUSES } from './use-submission-filters';
import type { SubmissionFilters } from './use-submission-filters';

export const SUBMISSION_PAGE_SIZE = 50;
/** The server caches the stats for 30 s: polling faster would only read the same answer. */
const STATS_REFRESH_MS = 30_000;

/** The judging-state boxes as the statuses they stand for, in box order (`undefined` when no box is ticked). */
const statusesOf = (filters: SubmissionFilters) =>
  filters.statusGroups.length
    ? filters.statusGroups.flatMap((group) => STATUS_GROUP_STATUSES[group])
    : undefined;

/** The list filters as the API takes them (`live` is a view setting and stays out). */
export const submissionListApiQuery = (filters: SubmissionFilters) => ({
  problem: filters.problem || undefined,
  user: filters.user || undefined,
  result: filters.results.length ? filters.results : undefined,
  language: filters.languageIds.length ? filters.languageIds : undefined,
  status: statusesOf(filters),
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

/** The source of one submission per viewer. The submission page mounts it once the detail is known (a 403 would repeat); the diff page deliberately fires detail and source together, so a forbidden side costs two doomed requests. */
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

/** Today's numbers for the list's strip: public, polled in the background (a failed poll keeps the last numbers). */
export const useSubmissionStatsQuery = () =>
  useQuery({
    queryKey: ['submissions', 'stats'],
    queryFn: fetchSubmissionStats,
    refetchInterval: STATS_REFRESH_MS,
    placeholderData: keepPreviousData,
  });

const userOfQueryKey = (queryKey: readonly unknown[] | undefined) =>
  (queryKey?.at(-1) as { user?: string } | undefined)?.user;

/** One page of a contest's submissions per viewer; `ownUsername` narrows it to the viewer (the backend would anyway). */
export const useContestSubmissionListQuery = (
  key: Ref<string>,
  filters: Ref<SubmissionFilters>,
  ownUsername: Ref<string | null>,
  isEnabled: Ref<boolean>,
) => {
  const viewerId = useViewerId();
  const apiQuery = computed(() => ({
    ...submissionListApiQuery(filters.value),
    user: ownUsername.value ?? (filters.value.user || undefined),
  }));
  return useQuery({
    enabled: isEnabled,
    queryKey: computed(() => ['submissions', 'contest', viewerId.value, key.value, apiQuery.value]),
    queryFn: () => fetchContestSubmissions(key.value, apiQuery.value),
    /** Only a list for the same user stays on screen while the next one loads: a switch to the own-only list must not show the all-users rows. */
    placeholderData: (previous, previousQuery) =>
      userOfQueryKey(previousQuery?.queryKey) === apiQuery.value.user ? previous : undefined,
  });
};

/** One page of an organization's member submissions per viewer; `isEnabled` holds it until the viewer is known to be inside. */
export const useOrganizationSubmissionListQuery = (
  slug: Ref<string>,
  filters: Ref<SubmissionFilters>,
  isEnabled: Ref<boolean>,
) => {
  const viewerId = useViewerId();
  const apiQuery = computed(() => submissionListApiQuery(filters.value));
  return useQuery({
    enabled: isEnabled,
    queryKey: computed(() => [
      'submissions',
      'organization',
      viewerId.value,
      slug.value,
      apiQuery.value,
    ]),
    queryFn: () => fetchOrganizationSubmissions(slug.value, apiQuery.value),
    placeholderData: keepPreviousData,
  });
};

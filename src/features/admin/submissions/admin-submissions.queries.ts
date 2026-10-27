import { useQuery } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { computed, toValue } from 'vue';
import { fetchSubmissions } from '@/api/submissions.api';
import type { SubmissionListQuery } from '@/api/types/submissions';
import { useViewerId } from '@/stores/use-viewer-id';
import { keepPreviousForSameViewer } from '@/features/contests/keep-previous-for-viewer';

/** A batch drains in seconds to minutes: a 5 s poll shows it moving without hammering the list. */
export const QUEUE_POLL_MS = 5_000;

/**
 * One page of the public list with staff filters. It shares the `['submissions', 'list']` prefix, so bulk actions (which
 * invalidate `['submissions']`) refresh it.
 */
export function useAdminSubmissionListQuery(
  query: MaybeRefOrGetter<SubmissionListQuery>,
  options: { pollMs?: number } = {},
) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['submissions', 'list', viewer.value, toValue(query)] as const),
    queryFn: () => fetchSubmissions(toValue(query)),
    placeholderData: computed(() => keepPreviousForSameViewer(2, viewer.value)),
    refetchInterval: options.pollMs,
  });
}

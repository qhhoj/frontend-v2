import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchDeletedProblems } from '@/api/problem-lifecycle.api';
import { useViewerId } from '@/stores/use-viewer-id';
import { keepPreviousForSameViewer } from '@/features/contests/keep-previous-for-viewer';

/** Prefix of the deleted list; delete, restore and purge-now invalidate it. */
export const DELETED_PROBLEMS_KEY = ['admin', 'problems-deleted'] as const;
/** Cached submission pages carry the problem's `isDeleted`; a delete or restore makes them stale. */
export const SUBMISSIONS_KEY = ['submissions'] as const;

export function useDeletedProblemsQuery(page: MaybeRefOrGetter<number>) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...DELETED_PROBLEMS_KEY, viewer.value, toValue(page)]),
    queryFn: () => fetchDeletedProblems(toValue(page)),
    placeholderData: computed(() => keepPreviousForSameViewer(2, viewer.value)),
  });
}

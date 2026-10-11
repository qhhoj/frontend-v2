import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { fetchRecentBatches } from '@/api/submission-actions.api';
import { useViewerId } from '@/stores/use-viewer-id';

/** Bulk rejudges and rescores write this list; their mutations invalidate the prefix. */
export const batchesKey = ['admin', 'submission-batches'] as const;

export function useRecentBatchesQuery() {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...batchesKey, viewer.value] as const),
    queryFn: fetchRecentBatches,
  });
}

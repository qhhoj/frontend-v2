import { useQuery } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { computed } from 'vue';
import { fetchJudgeQueue } from '@/api/judges-admin.api';
import { useViewerId } from '@/stores/use-viewer-id';

/** Staff watch an incident live: the board polls while the tab is visible (TanStack skips hidden tabs). */
export const JUDGE_POLL_MS = 10_000;

export function useJudgeQueueQuery(options: { enabled?: MaybeRefOrGetter<boolean> } = {}) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['admin', 'judge-queue', viewer.value] as const),
    queryFn: fetchJudgeQueue,
    enabled: options.enabled,
    refetchInterval: JUDGE_POLL_MS,
  });
}

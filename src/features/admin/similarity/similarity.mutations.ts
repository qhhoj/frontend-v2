import { useQueryClient } from '@tanstack/vue-query';
import { toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { startSimilarityRun } from '@/api/similarity.api';
import type { SimilarityScope } from '@/api/types/similarity';
import { isConflict } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { similarityRunsKey } from './similarity.queries';

/**
 * Starts a run of the scope the URL names. A started run refreshes that scope's list; a 409 refreshes it too, because the
 * run that blocks the start may be missing from the cached list (another tab or user started it). A change of scope drops
 * the last outcome, so a 429 for one scope never shows under another.
 */
export const useStartSimilarityRun = (scope: MaybeRefOrGetter<SimilarityScope | null>) => {
  const queryClient = useQueryClient();
  const start = useAdminMutation({
    mutate: (target: SimilarityScope) => startSimilarityRun(target),
    invalidates: (target) => [similarityRunsKey(target)],
  });
  /** Nothing is sent while the URL names no scope. */
  const startRun = async () => {
    const target = toValue(scope);
    if (!target) return undefined;
    const result = await start.run(target);
    if (isConflict(start.failure.value)) {
      await queryClient.invalidateQueries({ queryKey: similarityRunsKey(target) });
    }
    return result;
  };
  watch(
    () => JSON.stringify(toValue(scope)),
    () => start.reset(),
  );
  return { ...start, startRun };
};

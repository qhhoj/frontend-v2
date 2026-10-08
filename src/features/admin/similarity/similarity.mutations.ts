import { toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { startSimilarityRun } from '@/api/similarity.api';
import type { SimilarityScope } from '@/api/types/similarity';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { similarityRunsKey } from './similarity.queries';

/** Starts a run of the scope the URL names; a started run refreshes that scope's list. */
export const useStartSimilarityRun = (scope: MaybeRefOrGetter<SimilarityScope | null>) => {
  const start = useAdminMutation({
    mutate: (target: SimilarityScope) => startSimilarityRun(target),
    invalidates: (target) => [similarityRunsKey(target)],
  });
  /** Nothing is sent while the URL names no scope. */
  const startRun = () => {
    const target = toValue(scope);
    return target ? start.run(target) : undefined;
  };
  return { ...start, startRun };
};

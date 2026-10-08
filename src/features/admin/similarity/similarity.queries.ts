import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  fetchSimilarityPair,
  fetchSimilarityPairs,
  fetchSimilarityRun,
  fetchSimilarityRuns,
} from '@/api/similarity.api';
import type { SimilarityScope } from '@/api/types/similarity';
import { useViewerId } from '@/stores/use-viewer-id';
import { isActive } from './similarity-runs';
import { toPairsRequest } from './similarity-pairs';
import type { PairFilter } from './similarity-pairs';

/** While a run is queued or running its list or summary refreshes every 5 seconds; a settled one stops the timer. */
const RUN_POLL_MS = 5000;

/** The prefix of every runs list of one scope: a write invalidates by it. */
export const similarityRunsKey = (scope: SimilarityScope | null) =>
  ['admin', 'similarity-runs', scope] as const;
export const similarityRunKey = (runId: string | null) =>
  ['admin', 'similarity-run', runId] as const;

const pollWhileActive = (isAnyActive: boolean) => (isAnyActive ? RUN_POLL_MS : false);

/** The runs of one problem or contest; idle until the URL names a scope. */
export const useSimilarityRunsQuery = (scope: MaybeRefOrGetter<SimilarityScope | null>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...similarityRunsKey(toValue(scope)), viewer.value]),
    queryFn: () => fetchSimilarityRuns(toValue(scope) as SimilarityScope),
    enabled: computed(() => toValue(scope) !== null),
    refetchInterval: (query) => pollWhileActive(query.state.data?.some(isActive) ?? false),
  });
};

/** One run, for the summary; idle until the URL names a run. */
export const useSimilarityRunQuery = (runId: MaybeRefOrGetter<string | null>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...similarityRunKey(toValue(runId)), viewer.value]),
    queryFn: () => fetchSimilarityRun(toValue(runId) as string),
    enabled: computed(() => toValue(runId) !== null),
    refetchInterval: (query) =>
      pollWhileActive(query.state.data !== undefined && isActive(query.state.data)),
  });
};

export const similarityPairsKey = (runId: string) => ['admin', 'similarity-pairs', runId] as const;
export const similarityPairKey = (pairId: string) => ['admin', 'similarity-pair', pairId] as const;

/** One page of a run's pairs for the filter in the URL; the previous page stays on screen while the next loads. */
export const useSimilarityPairsQuery = (
  runId: MaybeRefOrGetter<string>,
  filter: MaybeRefOrGetter<PairFilter>,
) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [
      ...similarityPairsKey(toValue(runId)),
      toPairsRequest(toValue(filter)),
      viewer.value,
    ]),
    queryFn: () => fetchSimilarityPairs(toValue(runId), toPairsRequest(toValue(filter))),
    placeholderData: keepPreviousData,
  });
};

/** One pair with its sources and fragments; a hidden pair is a 404. */
export const useSimilarityPairQuery = (pairId: MaybeRefOrGetter<string>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...similarityPairKey(toValue(pairId)), viewer.value]),
    queryFn: () => fetchSimilarityPair(toValue(pairId)),
  });
};

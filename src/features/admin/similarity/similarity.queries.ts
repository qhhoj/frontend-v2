import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchSimilarityRun, fetchSimilarityRuns } from '@/api/similarity.api';
import type { SimilarityScope } from '@/api/types/similarity';
import { useViewerId } from '@/stores/use-viewer-id';
import { isActive } from './similarity-runs';

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

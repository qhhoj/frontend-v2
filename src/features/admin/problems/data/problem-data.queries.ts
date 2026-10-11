import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchInitYaml, fetchProblemData } from '@/api/problem-data.api';
import type { ProblemData } from '@/api/types/problem-data';
import { useViewerId } from '@/stores/use-viewer-id';

export const problemDataKey = (code: string, viewer: string) =>
  ['admin', 'problem-data', code, viewer] as const;

export function useProblemDataQuery(
  code: MaybeRefOrGetter<string>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => problemDataKey(toValue(code), viewer.value)),
    queryFn: () => fetchProblemData(toValue(code)),
    enabled: computed(() => toValue(enabled)),
  });
}

/** init.yml is fetched only while its dialog is open. */
export function useInitYamlQuery(
  code: MaybeRefOrGetter<string>,
  isOpen: MaybeRefOrGetter<boolean>,
) {
  return useQuery({
    queryKey: computed(() => ['admin', 'problem-init', toValue(code)]),
    queryFn: () => fetchInitYaml(toValue(code)),
    enabled: computed(() => toValue(isOpen)),
  });
}

/** A write's answer is the new configuration: it replaces the cached one for this viewer. */
export function useKeepDataAnswer(code: () => string) {
  const queryClient = useQueryClient();
  const viewer = useViewerId();
  return (saved: ProblemData) => {
    queryClient.setQueryData(problemDataKey(code(), viewer.value), saved);
  };
}

import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchInitYaml, fetchProblemData } from '@/api/problem-data.api';
import { useViewerId } from '@/stores/use-viewer-id';

export const problemDataKey = (code: string, viewer: string) =>
  ['admin', 'problem-data', code, viewer] as const;

export function useProblemDataQuery(code: MaybeRefOrGetter<string>) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => problemDataKey(toValue(code), viewer.value)),
    queryFn: () => fetchProblemData(toValue(code)),
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

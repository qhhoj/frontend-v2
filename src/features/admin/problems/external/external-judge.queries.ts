import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchExternalJudgeLink } from '@/api/external-judge.api';
import { useViewerId } from '@/stores/use-viewer-id';

export const externalJudgeLinkKey = (code: string, viewer: string) =>
  ['admin', 'external-judge', code, viewer] as const;

export function useExternalJudgeLinkQuery(code: MaybeRefOrGetter<string>) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => externalJudgeLinkKey(toValue(code), viewer.value)),
    queryFn: () => fetchExternalJudgeLink(toValue(code)),
  });
}

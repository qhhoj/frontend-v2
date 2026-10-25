import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchConfigRevisions } from '@/api/site-admin.api';
import { useViewerId } from '@/stores/use-viewer-id';
import { keepPreviousForViewer } from '@/features/contests/keep-previous-for-viewer';

export const configHistoryKey = ['admin', 'config-history'] as const;

export const useConfigHistoryQuery = (
  key: MaybeRefOrGetter<string>,
  page: MaybeRefOrGetter<number>,
) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...configHistoryKey, toValue(key), toValue(page), viewer.value]),
    queryFn: () => fetchConfigRevisions(toValue(key), toValue(page)),
    placeholderData: computed(() => keepPreviousForViewer(viewer.value)),
  });
};

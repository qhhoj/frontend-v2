import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import type { Ref } from 'vue';
import { fetchGhosts } from '@/api/contest-ghosts.api';
import { useViewerId } from '@/stores/use-viewer-id';

/** The ghost set of one contest as one editor sees it. */
export const ghostsKey = (viewerId: string, key: string) =>
  ['admin', 'contest-ghosts', viewerId, key] as const;

export const useGhostsQuery = (key: Ref<string>, isEnabled: Ref<boolean>) => {
  const viewerId = useViewerId();
  return useQuery({
    enabled: isEnabled,
    queryKey: computed(() => ghostsKey(viewerId.value, key.value)),
    queryFn: () => fetchGhosts(key.value),
  });
};

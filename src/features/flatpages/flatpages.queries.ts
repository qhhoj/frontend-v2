import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchFlatpage } from '@/api/flatpages.api';
import { useViewerId } from '@/stores/use-viewer-id';

/** Members-only pages answer per session (E21). */
export const useFlatpageQuery = (path: MaybeRefOrGetter<string>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['flatpages', toValue(path), viewer.value]),
    queryFn: () => fetchFlatpage(toValue(path)),
  });
};

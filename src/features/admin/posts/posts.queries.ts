import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchModerationPosts } from '@/api/blog-admin.api';
import type { ModerationState } from '@/api/blog-admin.api';
import { useViewerId } from '@/stores/use-viewer-id';

export const useModerationPostsQuery = (
  state: MaybeRefOrGetter<ModerationState>,
  page: MaybeRefOrGetter<number>,
) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['admin', 'posts', toValue(state), toValue(page), viewer.value]),
    queryFn: () => fetchModerationPosts(toValue(state), toValue(page)),
    placeholderData: keepPreviousData,
  });
};

import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchPost, fetchPosts } from '@/api/blog.api';
import type { PostFeed } from '@/api/types/blog';
import { useViewerId } from '@/stores/use-viewer-id';

export const usePostsQuery = (feed: MaybeRefOrGetter<PostFeed>, page: MaybeRefOrGetter<number>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['posts', 'list', toValue(feed), toValue(page), viewer.value]),
    queryFn: () => fetchPosts(toValue(feed), toValue(page)),
    placeholderData: keepPreviousData,
  });
};

/** An empty id (the editor's new post) fetches nothing. */
export const usePostQuery = (id: MaybeRefOrGetter<string>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['posts', 'detail', toValue(id), viewer.value]),
    queryFn: () => fetchPost(toValue(id)),
    enabled: computed(() => toValue(id) !== ''),
  });
};

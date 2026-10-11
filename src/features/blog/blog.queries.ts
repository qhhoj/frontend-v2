import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchComposeOptions, fetchMyDrafts, fetchPost, fetchPosts } from '@/api/blog.api';
import type { PostFeed } from '@/api/types/blog';
import { ANONYMOUS_VIEWER, useViewerId } from '@/stores/use-viewer-id';

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

/** The signed-in viewer's drafts and scheduled posts (a `posts` list key, so saves refresh it). */
export const useMyDraftsQuery = (page: MaybeRefOrGetter<number>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['posts', 'list', 'drafts', toValue(page), viewer.value]),
    queryFn: () => fetchMyDrafts(toValue(page)),
    enabled: computed(() => viewer.value !== ANONYMOUS_VIEWER),
    placeholderData: keepPreviousData,
  });
};

/** Where the signed-in viewer may post: personal posts and which organizations. */
export const useComposeOptionsQuery = () => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['posts', 'compose-options', viewer.value]),
    queryFn: fetchComposeOptions,
    enabled: computed(() => viewer.value !== ANONYMOUS_VIEWER),
    staleTime: 60_000,
  });
};

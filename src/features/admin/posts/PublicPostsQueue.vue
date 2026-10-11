<script setup lang="ts">
import type { PostListItem } from '@/api/types/blog';
import { usePostsQuery } from '@/features/blog/blog.queries';
import type { PostFlags, PublicFeed, RowFailure } from './moderation';
import PostsQueueView from './PostsQueueView.vue';

const props = withDefaults(
  defineProps<{
    feed: PublicFeed;
    page: number;
    rowFailure: RowFailure | null;
    pendingPostId?: string | null;
  }>(),
  { pendingPostId: null },
);
defineEmits<{ hide: [post: PostListItem]; flag: [post: PostListItem, patch: PostFlags] }>();
const { data, isPending, error, refetch } = usePostsQuery(
  () => props.feed,
  () => props.page,
);
</script>

<template>
  <PostsQueueView
    :feed="feed"
    :posts="data?.items ?? []"
    :meta="data?.meta"
    :is-pending="isPending"
    :error="error"
    :row-failure="rowFailure"
    :pending-post-id="pendingPostId"
    @retry="refetch()"
    @hide="$emit('hide', $event)"
    @flag="(post, patch) => $emit('flag', post, patch)"
  />
</template>

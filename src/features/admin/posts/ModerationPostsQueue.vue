<script setup lang="ts">
import type { PostListItem } from '@/api/types/blog';
import type { QueueFeed, RowFailure } from './moderation';
import PostsQueueView from './PostsQueueView.vue';
import { useModerationPostsQuery } from './posts.queries';

const props = withDefaults(
  defineProps<{
    feed: QueueFeed;
    page: number;
    rowFailure: RowFailure | null;
    pendingPostId?: string | null;
  }>(),
  { pendingPostId: null },
);
defineEmits<{ hide: [post: PostListItem]; show: [post: PostListItem] }>();
const { data, isPending, error, refetch } = useModerationPostsQuery(
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
    @show="$emit('show', $event)"
  />
</template>

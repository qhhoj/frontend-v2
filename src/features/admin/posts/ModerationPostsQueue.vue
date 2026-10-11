<script setup lang="ts">
import type { PostListItem } from '@/api/types/blog';
import type { PostFlags, QueueFeed, RowFailure } from './moderation';
import PostsQueueView from './PostsQueueView.vue';
import { useModerationPostsQuery } from './posts.queries';

const props = withDefaults(
  defineProps<{
    feed: QueueFeed;
    page: number;
    search: string;
    organization: string;
    rowFailure: RowFailure | null;
    pendingPostId?: string | null;
  }>(),
  { pendingPostId: null },
);
defineEmits<{
  hide: [post: PostListItem];
  show: [post: PostListItem];
  flag: [post: PostListItem, patch: PostFlags];
}>();
const { data, isPending, error, refetch } = useModerationPostsQuery(
  () => props.feed,
  () => props.page,
  () => props.search,
  () => props.organization,
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
    @flag="(post, patch) => $emit('flag', post, patch)"
  />
</template>

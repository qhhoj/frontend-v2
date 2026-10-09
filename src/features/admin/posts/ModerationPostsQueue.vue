<script setup lang="ts">
import type { PostListItem } from '@/api/types/blog';
import type { QueueFeed, RowFailure } from './moderation';
import PostsQueueView from './PostsQueueView.vue';
import { useModerationPostsQuery } from './posts.queries';

const props = defineProps<{ feed: QueueFeed; page: number; rowFailure: RowFailure | null }>();
defineEmits<{ hide: [post: PostListItem] }>();
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
    @retry="refetch()"
    @hide="$emit('hide', $event)"
  />
</template>

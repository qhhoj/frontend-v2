<script setup lang="ts">
import type { PostListItem } from '@/api/types/blog';
import { usePostsQuery } from '@/features/blog/blog.queries';
import type { PublicFeed, RowFailure } from './moderation';
import PostsQueueView from './PostsQueueView.vue';

const props = defineProps<{ feed: PublicFeed; page: number; rowFailure: RowFailure | null }>();
defineEmits<{ hide: [post: PostListItem] }>();
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
    @retry="refetch()"
    @hide="$emit('hide', $event)"
  />
</template>

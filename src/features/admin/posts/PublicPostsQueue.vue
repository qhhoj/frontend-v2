<script setup lang="ts">
import type { PostListItem } from '@/api/types/blog';
import { usePostsQuery } from '@/features/blog/blog.queries';
import type { PostFlags, PublicFeed, RowFailure } from './moderation';
import PostsTable from './PostsTable.vue';

const props = withDefaults(
  defineProps<{
    feed: PublicFeed;
    page: number;
    rowFailure: RowFailure | null;
    pendingPostId?: string | null;
    selectable?: boolean;
  }>(),
  { pendingPostId: null, selectable: false },
);
const selected = defineModel<Set<string>>('selected', { default: () => new Set<string>() });
defineEmits<{ hide: [post: PostListItem]; flag: [post: PostListItem, patch: PostFlags] }>();
const { data, isPending, error, refetch } = usePostsQuery(
  () => props.feed,
  () => props.page,
);
</script>

<template>
  <PostsTable
    v-model:selected="selected"
    :feed="feed"
    :posts="data?.items ?? []"
    :meta="data?.meta"
    :loading="isPending"
    :error="error"
    :row-failure="rowFailure"
    :pending-post-id="pendingPostId"
    :selectable="selectable"
    @retry="refetch()"
    @hide="$emit('hide', $event)"
    @flag="(post, patch) => $emit('flag', post, patch)"
  >
    <template #bulk="{ count }"><slot name="bulk" :count="count" /></template>
  </PostsTable>
</template>

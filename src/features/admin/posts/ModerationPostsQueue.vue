<script setup lang="ts">
import type { PostListItem } from '@/api/types/blog';
import type { PostFlags, QueueFeed, RowFailure } from './moderation';
import PostsTable from './PostsTable.vue';
import { useModerationPostsQuery } from './posts.queries';

const props = withDefaults(
  defineProps<{
    feed: QueueFeed;
    page: number;
    search: string;
    organization: string;
    rowFailure: RowFailure | null;
    pendingPostId?: string | null;
    selectable?: boolean;
  }>(),
  { pendingPostId: null, selectable: false },
);
const selected = defineModel<Set<string>>('selected', { default: () => new Set<string>() });
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
    @show="$emit('show', $event)"
    @flag="(post, patch) => $emit('flag', post, patch)"
  >
    <template #bulk="{ count }"><slot name="bulk" :count="count" /></template>
  </PostsTable>
</template>

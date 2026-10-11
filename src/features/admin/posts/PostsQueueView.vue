<script setup lang="ts">
import type { TotalPageMeta } from '@/api/client';
import type { PostListItem } from '@/api/types/blog';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import PostsTable from './PostsTable.vue';
import type { ModerationFeed, PostFlags, RowFailure } from './moderation';

/** The list of one tab: the loading, error and empty states, the table, and the pager. */
withDefaults(
  defineProps<{
    feed: ModerationFeed;
    posts: PostListItem[];
    meta: TotalPageMeta | undefined;
    isPending: boolean;
    error: unknown;
    rowFailure: RowFailure | null;
    pendingPostId?: string | null;
  }>(),
  { pendingPostId: null },
);
defineEmits<{
  retry: [];
  hide: [post: PostListItem];
  show: [post: PostListItem];
  flag: [post: PostListItem, patch: PostFlags];
}>();
</script>

<template>
  <GlassCard as="div" data-testid="posts-queue" class="overflow-hidden">
    <QueryState :loading="isPending" :error="error" @retry="$emit('retry')">
      <template #skeleton><SkeletonBlock class="m-4 h-48" /></template>
      <EmptyState v-if="posts.length === 0">{{ $t('admin.posts.empty') }}</EmptyState>
      <PostsTable
        v-else
        :posts="posts"
        :feed="feed"
        :row-failure="rowFailure"
        :pending-post-id="pendingPostId"
        @hide="$emit('hide', $event)"
        @show="$emit('show', $event)"
        @flag="(post, patch) => $emit('flag', post, patch)"
      />
      <div v-if="meta" class="flex flex-wrap items-center justify-between gap-3 p-4">
        <p class="text-sm text-muted">
          {{ $t('admin.posts.footer', { shown: posts.length, total: meta.total }) }}
        </p>
        <NumberedPager :meta="meta" :label="$t('admin.posts.pager')" />
      </div>
    </QueryState>
  </GlassCard>
</template>

<script setup lang="ts">
import type { CommentPageLink } from '@/api/types/comments';
import { commentRoute } from '@/lib/comment-links';

/** Where a comment is: its page as a link to the comment, and the kind of page under it. */
const props = defineProps<{ item: { page: CommentPageLink; comment: { id: string } } }>();
const target = () => commentRoute(props.item.page, props.item.comment.id);
</script>

<template>
  <span class="flex max-w-48 min-w-0 flex-col">
    <RouterLink
      v-if="target()"
      :to="target()!"
      class="truncate font-semibold text-accent-text hover:underline"
    >
      {{ item.page.title }}
    </RouterLink>
    <span v-else class="truncate font-semibold">{{ item.page.title }}</span>
    <span class="text-caption leading-4 text-muted">{{
      $t(`admin.comments.all.pageTypes.${item.page.type}`)
    }}</span>
  </span>
</template>

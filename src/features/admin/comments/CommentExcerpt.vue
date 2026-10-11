<script setup lang="ts">
import type { AdminCommentItem } from '@/api/types/comments';
import UserName from '@/components/UserName.vue';

/** A moderated comment in a table cell: its author, then two lines of its text; the default slot adds notes under it. */
defineProps<{
  comment: Pick<AdminCommentItem['comment'], 'author' | 'excerpt'>;
}>();
</script>

<template>
  <div class="flex max-w-xl min-w-0 flex-col gap-0.5 py-2">
    <UserName
      v-if="comment.author"
      :username="comment.author.username"
      :rating="comment.author.rating"
    />
    <span v-else class="font-semibold text-muted">{{ $t('comments.deletedAccount') }}</span>
    <p class="m-0 line-clamp-2 break-words whitespace-pre-line text-muted">
      {{ comment.excerpt || $t('comments.deleted.placeholder') }}
    </p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RecentComment } from '@/api/types/comments';
import UserContent from '@/components/UserContent.vue';
import UserLink from '@/components/UserLink.vue';
import { commentRoute } from '@/lib/comment-links';
import { formatAgo, signedScore } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

/** One comment in a list of recent comments; `now` is the list's one clock, so every row ages together. */
const props = defineProps<{ comment: RecentComment; now: number }>();
const locale = useLocaleStore();
/** The page's screen with the comment's anchor; null for a tag problem, which has no screen. */
const target = computed(() => commentRoute(props.comment.page, props.comment.id));
</script>

<template>
  <article class="flex flex-col gap-1">
    <p class="flex flex-wrap items-center gap-x-1 text-sm">
      <UserLink
        v-if="comment.author"
        :username="comment.author.username"
        :rating="comment.author.rating"
      />
      <span v-else class="font-semibold text-muted">{{ $t('comments.deletedAccount') }}</span>
      {{ $t('comments.inPage') }}
      <RouterLink v-if="target" :to="target" class="font-semibold text-accent-text hover:underline">
        {{ comment.page.title }}
      </RouterLink>
      <span v-else class="font-semibold">{{ comment.page.title }}</span>
    </p>
    <UserContent :html="comment.bodyHtml" class="line-clamp-2 text-sm text-muted" />
    <p class="text-xs text-muted">
      {{ formatAgo(comment.createdAt, now, locale.locale) }} · {{ signedScore(comment.score) }}
    </p>
  </article>
</template>

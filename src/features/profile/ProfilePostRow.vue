<script setup lang="ts">
import type { PostListItem } from '@/api/types/blog';
import Card from '@/components/ui/Card.vue';
import UserContent from '@/components/UserContent.vue';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';

/** One post in a user's blog list: its title, a two-line summary, and the date, score and comment count. */
defineProps<{ post: PostListItem }>();
const locale = useLocaleStore();
</script>

<template>
  <Card as="article" class="flex flex-col gap-2 p-4 sm:p-5">
    <h2 class="font-display text-base font-bold">
      <RouterLink
        :to="{ name: 'post', params: { id: post.id } }"
        class="text-content hover:text-accent-text hover:underline"
      >
        {{ post.title }}
      </RouterLink>
    </h2>
    <UserContent :html="post.summaryHtml" class="line-clamp-2 text-sm text-muted" />
    <p class="text-caption leading-4 text-muted">
      {{
        $t('profileTabs.postLine', {
          date: formatDate(post.publishOn, 'date', locale.locale),
          score: formatNumber(post.score, locale.locale),
          count: formatNumber(post.commentCount, locale.locale),
        })
      }}
    </p>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import StatePanel from '@/components/StatePanel.vue';
import CommunityCard from '@/features/community/CommunityCard.vue';
import { usePostsQuery } from '@/features/blog/blog.queries';
import { summaryExcerpt } from '@/features/blog/post-summary';
import { formatNumber, formatShortDate } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

const POST_COUNT = 5;
const locale = useLocaleStore();
const { data, isPending, error, refetch } = usePostsQuery('global', 1);
const posts = computed(() => (data.value?.items ?? []).slice(0, POST_COUNT));
</script>

<template>
  <CommunityCard
    data-testid="new-posts"
    :title="$t('home.anon.newPosts')"
    :loading="isPending"
    :error="error"
    @retry="refetch()"
  >
    <template #skeleton>
      <div v-for="row in 3" :key="row" class="flex flex-col gap-1.5">
        <div class="h-4 w-3/4 rounded-pill bg-skeleton" />
        <div class="h-3 w-1/2 rounded-pill bg-skeleton" />
      </div>
    </template>
    <StatePanel v-if="!posts.length" kind="communityEmpty" :title="$t('blog.empty')" />
    <ul v-else class="flex flex-col gap-4">
      <li v-for="post in posts" :key="post.id" class="flex flex-col gap-1">
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded-pill bg-surface-strong px-2 font-mono text-xs tabular-nums">
            {{ $t('home.anon.score', { score: formatNumber(post.score, locale.locale) }) }}
          </span>
          <span
            v-if="post.sticky"
            class="rounded-pill bg-accent-soft px-2 text-xs font-semibold text-accent-soft-text"
            >{{ $t('blog.pinned') }}</span
          >
        </div>
        <RouterLink
          :to="{ name: 'post', params: { id: post.id } }"
          class="font-semibold hover:underline"
          >{{ post.title }}</RouterLink
        >
        <p class="line-clamp-2 text-sm text-muted">{{ summaryExcerpt(post.summaryHtml) }}</p>
        <p class="text-xs text-muted">
          {{ post.authors.map((author) => author.username).join(', ') }}
          · {{ formatShortDate(post.publishOn, locale.locale) }} ·
          {{ $t('blog.comments', { count: formatNumber(post.commentCount, locale.locale) }) }}
        </p>
      </li>
    </ul>
    <template #footer>
      <RouterLink :to="{ name: 'blog' }" class="font-semibold text-accent-text hover:underline">
        {{ $t('home.anon.allPosts') }}
      </RouterLink>
    </template>
  </CommunityCard>
</template>

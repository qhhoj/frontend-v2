<script setup lang="ts">
import Chip from '@/components/ui/Chip.vue';
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import SeeAllLink from '@/components/ui/SeeAllLink.vue';
import StatePanel from '@/components/StatePanel.vue';
import { usePostsQuery } from '@/features/blog/blog.queries';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';

const POST_COUNT = 3;
const locale = useLocaleStore();
const { data, isPending, error, refetch } = usePostsQuery('global', 1);
const posts = computed(() => (data.value?.items ?? []).slice(0, POST_COUNT));
</script>

<template>
  <Card data-testid="new-posts" padding="sm" :title="$t('home.anon.newPosts')">
    <template #actions>
      <SeeAllLink :to="{ name: 'blog' }">{{ $t('home.anon.allPosts') }}</SeeAllLink>
    </template>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <div class="flex flex-col gap-3">
          <div v-for="row in 3" :key="row" class="flex flex-col gap-1.5">
            <SkeletonBlock pill class="h-4 w-3/4" />
            <SkeletonBlock pill class="h-3 w-1/2" />
          </div>
        </div>
      </template>
      <StatePanel v-if="!posts.length" kind="communityEmpty" :title="$t('blog.empty')" />
      <ul v-else class="flex flex-col divide-y divide-line">
        <li
          v-for="post in posts"
          :key="post.id"
          class="flex items-baseline gap-2 py-1.5 first:pt-0 last:pb-0"
        >
          <Chip v-if="post.sticky" tone="accent">{{ $t('blog.pinned') }}</Chip>
          <RouterLink
            :to="{ name: 'post', params: { id: post.id } }"
            class="min-w-0 flex-1 truncate font-semibold hover:underline touch:-my-3.5 touch:py-3.5"
            >{{ post.title }}</RouterLink
          >
          <span class="shrink-0 text-caption text-muted">
            {{ formatDate(post.publishOn, 'short', locale.locale) }} ·
            {{ $t('blog.comments', { count: formatNumber(post.commentCount, locale.locale) }) }}
          </span>
        </li>
      </ul>
    </QueryState>
  </Card>
</template>

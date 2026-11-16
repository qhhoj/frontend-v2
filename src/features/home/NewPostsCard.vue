<script setup lang="ts">
import type { PostListItem } from '@/api/types/blog';
import Chip from '@/components/ui/Chip.vue';
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import PageSection from '@/components/ui/PageSection.vue';
import SeeAllLink from '@/components/ui/SeeAllLink.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import EmptyState from '@/components/EmptyState.vue';
import { usePostsQuery } from '@/features/blog/blog.queries';
import { summaryExcerpt } from '@/features/blog/post-summary';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';

const POST_COUNT = 4;
const BLOG = { name: 'blog' };
const locale = useLocaleStore();
const { data, isPending, error, refetch } = usePostsQuery('global', 1);
const posts = computed(() => (data.value?.items ?? []).slice(0, POST_COUNT));
const excerptOf = (post: PostListItem) => summaryExcerpt(post.summaryHtml);
</script>

<template>
  <PageSection
    data-testid="new-posts"
    :title="$t('home.posts')"
    :see-all="{ to: { name: 'blog' }, label: $t('common.viewAll') }"
  >
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <div class="flex flex-col gap-3">
          <div v-for="row in 3" :key="row" class="flex flex-col gap-1.5">
            <SkeletonBlock pill class="h-4 w-3/4" />
            <SkeletonBlock pill class="h-3 w-1/2" />
          </div>
        </div>
      </template>
      <EmptyState v-if="!posts.length" inline>
        <template #default>{{ $t('blog.empty') }}</template>
        <template #action>
          <SeeAllLink :to="BLOG">{{ $t('common.viewAll') }}</SeeAllLink>
        </template>
      </EmptyState>
      <ul v-else class="flex flex-col divide-y divide-line">
        <li v-for="post in posts" :key="post.id">
          <RouterLink
            :to="{ name: 'post', params: { id: post.id } }"
            class="flex min-h-(--qh-row) flex-col justify-center gap-0.5 py-2 text-content hover:bg-surface-hover"
          >
            <span class="flex min-w-0 items-center gap-2">
              <Chip v-if="post.sticky" tone="accent" size="sm" class="shrink-0">{{
                $t('blog.pinned')
              }}</Chip>
              <span class="min-w-0 flex-1 truncate font-semibold">{{ post.title }}</span>
              <span class="shrink-0 text-caption whitespace-nowrap text-muted max-sm:hidden">
                {{ $t('blog.comments', { count: formatNumber(post.commentCount, locale.locale) }) }}
                · {{ formatDate(post.publishOn, 'short', locale.locale) }}
              </span>
            </span>
            <span class="text-caption text-muted sm:hidden">
              {{ $t('blog.comments', { count: formatNumber(post.commentCount, locale.locale) }) }}
              · {{ formatDate(post.publishOn, 'short', locale.locale) }}
            </span>
            <span v-if="excerptOf(post)" class="truncate text-meta text-muted max-sm:hidden">{{
              excerptOf(post)
            }}</span>
          </RouterLink>
        </li>
      </ul>
    </QueryState>
  </PageSection>
</template>

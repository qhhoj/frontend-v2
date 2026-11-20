<script setup lang="ts">
import { computed } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import PageSection from '@/components/ui/PageSection.vue';
import AppButton from '@/components/ui/AppButton.vue';
import StretchedLink from '@/components/ui/StretchedLink.vue';
import { usePostsQuery } from '@/features/blog/blog.queries';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';

/**
 * "Tin mới": the newest posts of the global feed, pinned ones first, one row each, a link as a whole: the title, then
 * the date, "Ghim" and the comments on one meta line.
 */
const POST_COUNT = 3;
const BLOG = { name: 'blog' };
const locale = useLocaleStore();
const { data, isPending, error, refetch } = usePostsQuery('global', 1);
/** The feed already puts pinned posts first; the sort keeps that true whatever the feed's order. */
const posts = computed(() =>
  [...(data.value?.items ?? [])]
    .sort((left, right) => Number(right.sticky) - Number(left.sticky))
    .slice(0, POST_COUNT),
);
const ROW = 'flex min-h-(--qh-row) flex-col justify-center gap-0.5 px-2 py-2 touch:min-h-13';
</script>

<template>
  <PageSection
    data-testid="new-posts"
    :title="$t('home.posts')"
    :see-all="{ to: BLOG, label: $t('nav.blog') }"
  >
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <ul class="flex flex-col divide-y divide-line">
          <li v-for="row in POST_COUNT" :key="row" :class="ROW">
            <span><SkeletonBlock text class="w-3/4" /></span>
            <span class="text-small"><SkeletonBlock text class="w-1/3" /></span>
          </li>
        </ul>
      </template>
      <EmptyState v-if="!posts.length" inline>
        <template #default>{{ $t('blog.empty') }}</template>
        <template #action>
          <AppButton tone="link" class="text-meta" :to="BLOG">{{ $t('common.viewAll') }}</AppButton>
        </template>
      </EmptyState>
      <ul v-else class="flex flex-col divide-y divide-line">
        <li v-for="post in posts" :key="post.id" class="box-link" :class="ROW">
          <StretchedLink
            :to="{ name: 'post', params: { id: post.id } }"
            class="line-clamp-2 font-semibold text-content"
            >{{ post.title }}</StretchedLink
          >
          <span class="text-small text-muted">
            {{ formatDate(post.publishOn, 'short', locale.locale) }}
            <template v-if="post.sticky"> · {{ $t('blog.pinned') }}</template>
            <template v-if="post.commentCount">
              ·
              {{ $t('blog.comments', { count: formatNumber(post.commentCount, locale.locale) }) }}
            </template>
          </span>
        </li>
      </ul>
    </QueryState>
  </PageSection>
</template>

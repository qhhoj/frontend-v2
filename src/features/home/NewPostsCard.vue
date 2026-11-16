<script setup lang="ts">
import Chip from '@/components/ui/Chip.vue';
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import PageSection from '@/components/ui/PageSection.vue';
import SeeAllLink from '@/components/ui/SeeAllLink.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import EmptyState from '@/components/EmptyState.vue';
import { usePostsQuery } from '@/features/blog/blog.queries';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';

const POST_COUNT = 3;
const BLOG = { name: 'blog' };
const locale = useLocaleStore();
const { data, isPending, error, refetch } = usePostsQuery('global', 1);
const posts = computed(() => (data.value?.items ?? []).slice(0, POST_COUNT));
</script>

<template>
  <PageSection
    data-testid="new-posts"
    :title="$t('home.anon.newPosts')"
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
        <li
          v-for="post in posts"
          :key="post.id"
          class="flex min-h-(--qh-row) flex-wrap items-center gap-x-2 py-1.5 sm:flex-nowrap"
        >
          <Chip v-if="post.sticky" tone="accent">{{ $t('blog.pinned') }}</Chip>
          <RouterLink
            :to="{ name: 'post', params: { id: post.id } }"
            class="min-w-0 flex-1 truncate font-semibold hover:underline max-sm:basis-full touch:-my-3.5 touch:py-3.5"
            >{{ post.title }}</RouterLink
          >
          <!-- On phones the date and comment count sit under the title so the title gets the full width. -->
          <span class="shrink-0 text-caption text-muted max-sm:basis-full">
            {{ formatDate(post.publishOn, 'short', locale.locale) }} ·
            {{ $t('blog.comments', { count: formatNumber(post.commentCount, locale.locale) }) }}
          </span>
        </li>
      </ul>
    </QueryState>
  </PageSection>
</template>

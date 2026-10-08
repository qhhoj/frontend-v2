<script setup lang="ts">
import { Pencil, Rss } from 'lucide-vue-next';
import type { RouteLocationRaw } from 'vue-router';
import { computed, ref, watch } from 'vue';
import GlassCard from '@/components/GlassCard.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import type { PostFeed } from '@/api/types/blog';
import NewProblemsCard from '@/features/community/NewProblemsCard.vue';
import RecentCommentsCard from '@/features/community/RecentCommentsCard.vue';
import TopContributorsCard from '@/features/community/TopContributorsCard.vue';
import { useSessionStore } from '@/stores/session.store';
import PostRow from './PostRow.vue';
import PostRowSkeleton from './PostRowSkeleton.vue';
import { usePostsQuery } from './blog.queries';
import { useBlogRoute } from './use-blog-route';

const { feed, page } = useBlogRoute();
const session = useSessionStore();
const { data, isPending, error, refetch } = usePostsQuery(feed, page);
const posts = computed(() => data.value?.items ?? []);
const meta = computed(() => data.value?.meta);
const FEED_TABS: { feed: PostFeed; to: RouteLocationRaw }[] = [
  { feed: 'global', to: { name: 'blog' } },
  { feed: 'all', to: { name: 'blog', query: { feed: 'all' } } },
];
const TAB =
  'inline-flex min-h-11 items-center rounded-pill px-4 font-semibold hover:bg-surface-hover aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent-soft-text';
const TOOL =
  'inline-flex min-h-11 items-center gap-2 rounded-pill border border-line px-4 font-semibold text-content hover:bg-surface-hover';

/** Another page or feed is a new list: bring its top (not the rail's) into view, below the shell's header. */
const listTop = ref<HTMLElement | null>(null);
watch([feed, page], () => listTop.value?.scrollIntoView({ block: 'start' }));
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-8">
    <header class="flex flex-col gap-2">
      <h1 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {{ $t('blog.title') }}
      </h1>
      <p class="text-muted">{{ $t('blog.lead') }}</p>
    </header>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <nav :aria-label="$t('blog.feedsLabel')" class="glass flex flex-wrap gap-1 rounded-pill p-1">
        <template v-for="tab in FEED_TABS" :key="tab.feed">
          <RouterLink v-slot="{ href, navigate }" custom :to="tab.to">
            <a
              :href="href"
              :class="TAB"
              :aria-current="feed === tab.feed ? 'page' : undefined"
              @click="navigate"
            >
              {{ $t(`blog.feeds.${tab.feed}`) }}
            </a>
          </RouterLink>
        </template>
      </nav>
      <div class="flex flex-wrap items-center gap-2.5">
        <RouterLink v-if="session.user" :to="{ name: 'post-new' }" :class="TOOL">
          <Pencil aria-hidden="true" class="size-4" />
          {{ $t('blog.write') }}
        </RouterLink>
        <a href="/api/internal/feeds/blog/rss" :aria-label="$t('blog.rss')" :class="TOOL">
          <Rss aria-hidden="true" class="size-4" />
          RSS
        </a>
      </div>
    </div>
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div ref="listTop" class="scroll-mt-20">
        <GlassCard as="div" data-testid="post-list" class="overflow-hidden">
          <QueryState :loading="isPending" :error="error" @retry="refetch()">
            <template #skeleton>
              <div class="divide-y divide-line">
                <PostRowSkeleton v-for="row in 6" :key="row" />
              </div>
            </template>
            <StatePanel v-if="!posts.length" kind="communityEmpty" :title="$t('blog.empty')" />
            <div v-else class="divide-y divide-line">
              <PostRow v-for="post in posts" :key="post.id" :post="post" />
            </div>
            <NumberedPager v-if="meta" class="p-4" :meta="meta" :label="$t('blog.pager')" />
          </QueryState>
        </GlassCard>
      </div>
      <aside class="flex flex-col gap-5">
        <RecentCommentsCard :limit="3" />
        <NewProblemsCard :limit="4" />
        <TopContributorsCard :limit="3" />
      </aside>
    </div>
  </div>
</template>

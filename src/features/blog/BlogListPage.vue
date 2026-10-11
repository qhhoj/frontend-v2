<script setup lang="ts">
import { ChevronRight, FilePen, Pencil, Rss } from 'lucide-vue-next';
import type { RouteLocationRaw } from 'vue-router';
import { computed, ref, watch } from 'vue';
import GlassCard from '@/components/GlassCard.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import StateBit from '@/components/StateBit.vue';
import StatePanel from '@/components/StatePanel.vue';
import type { PostFeed } from '@/api/types/blog';
import NewProblemsCard from '@/features/community/NewProblemsCard.vue';
import RecentCommentsCard from '@/features/community/RecentCommentsCard.vue';
import TopContributorsCard from '@/features/community/TopContributorsCard.vue';
import { useSessionStore } from '@/stores/session.store';
import PostCard from './PostCard.vue';
import PostCardSkeleton from './PostCardSkeleton.vue';
import PostRow from './PostRow.vue';
import PostRowSkeleton from './PostRowSkeleton.vue';
import { useMyDraftsQuery, usePostsQuery } from './blog.queries';
import { WRITE_BUTTON_CLASS } from './post-state';
import { useBlogRoute } from './use-blog-route';

const { feed, page } = useBlogRoute();
const session = useSessionStore();
const { data, isPending, error, refetch } = usePostsQuery(feed, page);
const items = computed(() => data.value?.items ?? []);
/** Pinned posts lead as cards; the rest of the page is the compact list. */
const pinned = computed(() => items.value.filter((post) => post.sticky));
const posts = computed(() => items.value.filter((post) => !post.sticky));
/** Only the first page of the newsfeed can open with pinned cards. */
const expectsPinned = computed(() => feed.value === 'global' && page.value === 1);
const meta = computed(() => data.value?.meta);
/** The signed-in viewer's unpublished posts: a link to them while there are any. */
const drafts = useMyDraftsQuery(1);
const draftCount = computed(() => (session.user ? (drafts.data.value?.meta.total ?? 0) : 0));
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
  <div class="page-column">
    <header class="flex items-center justify-between gap-3">
      <div class="flex min-w-0 flex-col gap-2">
        <h1 class="page-title">
          {{ $t('blog.title') }}
        </h1>
        <p class="text-muted">{{ $t('blog.lead') }}</p>
      </div>
      <StateBit variant="writing" size="inline" class="shrink-0" />
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
        <RouterLink v-if="session.user" :to="{ name: 'post-new' }" :class="WRITE_BUTTON_CLASS">
          <Pencil aria-hidden="true" class="size-4" />
          {{ $t('blog.write') }}
        </RouterLink>
        <a href="/api/internal/feeds/blog/rss" :aria-label="$t('blog.rss')" :class="TOOL">
          <Rss aria-hidden="true" class="size-4" />
          RSS
        </a>
      </div>
    </div>
    <section
      v-if="pinned.length || (isPending && expectsPinned)"
      :aria-label="$t('blog.pinnedLabel')"
      class="grid gap-4 sm:grid-cols-2"
    >
      <template v-if="isPending">
        <PostCardSkeleton v-for="card in 2" :key="card" />
      </template>
      <PostCard v-for="post in pinned" v-else :key="post.id" :post="post" />
    </section>
    <RouterLink
      v-if="draftCount > 0"
      :to="{ name: 'post-drafts' }"
      data-testid="my-drafts"
      class="glass flex min-h-14 items-center gap-3 rounded-card px-4 font-semibold hover:bg-surface-hover sm:px-5"
    >
      <FilePen aria-hidden="true" class="size-5 text-accent-text" />
      <span class="flex-1">{{ $t('blog.myDrafts') }}</span>
      <span class="rounded-pill bg-surface-hover px-2.5 py-0.5 text-sm text-muted">
        {{ draftCount }}
      </span>
      <ChevronRight aria-hidden="true" class="size-4 text-muted" />
    </RouterLink>
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_var(--qh-sidebar-width)]">
      <div ref="listTop" class="scroll-mt-20">
        <GlassCard as="div" data-testid="post-list" class="overflow-hidden">
          <QueryState :loading="isPending" :error="error" @retry="refetch()">
            <template #skeleton>
              <div class="divide-y divide-line">
                <PostRowSkeleton v-for="row in 6" :key="row" />
              </div>
            </template>
            <StatePanel v-if="!items.length" kind="communityEmpty" :title="$t('blog.empty')" />
            <div v-else-if="posts.length" class="divide-y divide-line">
              <PostRow v-for="post in posts" :key="post.id" :post="post" />
            </div>
            <NumberedPager v-if="meta" class="p-4" :meta="meta" :label="$t('blog.pager')" />
          </QueryState>
        </GlassCard>
      </div>
      <GlassCard
        as="aside"
        class="relative divide-y divide-line [&>section]:p-4 sm:[&>section]:p-5"
      >
        <StateBit
          variant="community"
          size="tiny"
          class="absolute top-4 right-4 sm:top-5 sm:right-5"
        />
        <RecentCommentsCard embedded :limit="3" />
        <NewProblemsCard embedded :limit="4" />
        <TopContributorsCard embedded :limit="3" />
      </GlassCard>
    </div>
  </div>
</template>

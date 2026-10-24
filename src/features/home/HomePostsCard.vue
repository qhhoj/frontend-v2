<script setup lang="ts">
import { Pin } from 'lucide-vue-next';
import { computed } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import Card from '@/components/ui/Card.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import UserName from '@/components/UserName.vue';
import { usePostsQuery } from '@/features/blog/blog.queries';
import { formatAgo } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';

/**
 * The school's newest posts on the signed-in home, in the right column. The feed already lists pinned posts
 * first (rules, exam calendars), so the first three are the ones a student must not miss. A compact sibling of the
 * guests' `NewPostsCard`: titles and bylines only, no scores or excerpts.
 */
const POST_COUNT = 3;
/** The three-row list's height: the skeleton, a shorter list and the empty message all keep it, so Top rating below does not move. */
const LIST_MIN_HEIGHT = 'min-h-[10.5rem]';
const ROW = 'flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0';
const locale = useLocaleStore();
const now = useNow(60_000);
const { data, isPending, error, refetch } = usePostsQuery('global', 1);
const posts = computed(() => (data.value?.items ?? []).slice(0, POST_COUNT));
</script>

<template>
  <Card data-testid="home-posts" class="p-6">
    <div class="mb-3 flex items-center justify-between gap-2">
      <h2 class="font-display text-base font-bold">{{ $t('home.anon.newPosts') }}</h2>
      <RouterLink :to="{ name: 'blog' }" class="text-sm text-accent-text hover:underline">{{
        $t('nav.blog')
      }}</RouterLink>
    </div>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <ul class="flex flex-col divide-y divide-line" :class="LIST_MIN_HEIGHT">
          <li v-for="row in POST_COUNT" :key="row" :class="ROW">
            <span class="font-semibold"><SkeletonBlock text class="w-3/4" /></span>
            <span class="text-meta"><SkeletonBlock text class="w-1/2" /></span>
          </li>
        </ul>
      </template>
      <EmptyState v-if="!posts.length" compact :class="LIST_MIN_HEIGHT">{{
        $t('blog.empty')
      }}</EmptyState>
      <ul v-else class="flex flex-col divide-y divide-line" :class="LIST_MIN_HEIGHT">
        <li v-for="post in posts" :key="post.id" :class="ROW">
          <RouterLink
            :to="{ name: 'post', params: { id: post.id } }"
            class="line-clamp-2 font-semibold [overflow-wrap:anywhere] hover:underline"
          >
            <Pin
              v-if="post.sticky"
              data-testid="post-pinned"
              role="img"
              class="mr-1 inline size-3.5 align-[-0.125em] text-accent-text"
              :aria-label="$t('blog.pinnedLabel')"
            />{{ post.title }}</RouterLink
          >
          <p class="truncate text-meta text-muted">
            <template v-for="author in post.authors" :key="author.id"
              ><UserName :username="author.username" :rating="author.rating" /> ·
            </template>
            <span class="font-mono">{{ formatAgo(post.publishOn, now, locale.locale) }}</span>
          </p>
        </li>
      </ul>
    </QueryState>
  </Card>
</template>

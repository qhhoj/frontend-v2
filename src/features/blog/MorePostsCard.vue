<script setup lang="ts">
import { computed } from 'vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useUserPostsQuery } from '@/features/users/users.queries';

/** Up to three other posts of one author, as title links; the post on screen is left out. */
const MORE_POSTS_COUNT = 3;
const props = defineProps<{ username: string; excludeId: string }>();
const { data, isPending, error, refetch } = useUserPostsQuery(() => props.username, 1);
const posts = computed(() =>
  (data.value?.items ?? [])
    .filter((post) => post.id !== props.excludeId)
    .slice(0, MORE_POSTS_COUNT),
);
</script>

<template>
  <GlassCard data-testid="more-posts" class="flex flex-col gap-3 p-4 sm:p-5">
    <h2 class="font-display text-base font-bold">{{ $t('blogPost.morePosts') }}</h2>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <div class="flex flex-col gap-2.5">
          <SkeletonBlock v-for="row in MORE_POSTS_COUNT" :key="row" pill class="h-4 w-full" />
        </div>
      </template>
      <ul v-if="posts.length" class="flex flex-col gap-2.5">
        <li v-for="post in posts" :key="post.id">
          <RouterLink
            :to="{ name: 'post', params: { id: post.id } }"
            class="font-semibold text-accent-text hover:underline [overflow-wrap:anywhere]"
          >
            {{ post.title }}
          </RouterLink>
        </li>
      </ul>
      <p v-else class="text-sm text-muted">{{ $t('blogPost.noMorePosts') }}</p>
    </QueryState>
  </GlassCard>
</template>

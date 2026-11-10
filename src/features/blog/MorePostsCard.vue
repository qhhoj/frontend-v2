<script setup lang="ts">
import { computed } from 'vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import Card from '@/components/ui/Card.vue';
import { useUserPostsQuery } from '@/features/users/users.queries';

/** Up to three other posts of one author, as title links; the post on screen is left out. With none (or a failed read) the card is not drawn. */
const MORE_POSTS_COUNT = 3;
const props = defineProps<{ username: string; excludeId: string }>();
const { data, isPending } = useUserPostsQuery(() => props.username, 1);
const posts = computed(() =>
  (data.value?.items ?? [])
    .filter((post) => post.id !== props.excludeId)
    .slice(0, MORE_POSTS_COUNT),
);
</script>

<template>
  <Card
    v-if="isPending || posts.length"
    data-testid="more-posts"
    padding="md"
    :title="$t('blogPost.morePosts')"
  >
    <div v-if="isPending" class="flex flex-col gap-2.5" aria-hidden="true">
      <SkeletonBlock v-for="row in MORE_POSTS_COUNT" :key="row" pill class="h-4 w-full" />
    </div>
    <ul v-else class="flex flex-col gap-2.5">
      <li v-for="post in posts" :key="post.id">
        <RouterLink
          :to="{ name: 'post', params: { id: post.id } }"
          class="font-semibold text-accent-text hover:underline [overflow-wrap:anywhere]"
        >
          {{ post.title }}
        </RouterLink>
      </li>
    </ul>
  </Card>
</template>

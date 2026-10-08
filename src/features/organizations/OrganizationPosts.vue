<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import StatePanel from '@/components/StatePanel.vue';
import PostRow from '@/features/blog/PostRow.vue';
import { pageFromQuery } from '@/lib/paging';
import { useOrganizationPostsQuery } from './organizations.queries';
import { useOrganization } from './use-organization';

/** The organization's posts, newest first, one page per `?page=`. */
const route = useRoute();
const { slug } = useOrganization();
const page = computed(() => pageFromQuery(route.query.page));
const { data, error, isPending, refetch } = useOrganizationPostsQuery(slug, page);
const posts = computed(() => data.value?.items ?? []);
</script>

<template>
  <QueryState :loading="isPending" :error="error" @retry="refetch()">
    <template #skeleton><SkeletonBlock class="h-40 w-full" /></template>
    <StatePanel v-if="!posts.length" kind="communityEmpty" :title="$t('orgMembership.noPosts')" />
    <div
      v-else
      class="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface"
    >
      <PostRow v-for="post in posts" :key="post.id" :post="post" />
    </div>
    <NumberedPager
      v-if="data"
      :meta="data.meta"
      :label="$t('orgMembership.postsPager')"
      class="mt-2"
    />
  </QueryState>
</template>

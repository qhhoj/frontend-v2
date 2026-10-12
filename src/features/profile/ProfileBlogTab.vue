<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import EmptyState from '@/components/EmptyState.vue';
import Card from '@/components/ui/Card.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import { useUserPostsQuery } from '@/features/users/users.queries';
import { pageFromQuery } from '@/lib/paging';
import ProfilePostRow from './ProfilePostRow.vue';
import ProfileTabSkeleton from './ProfileTabSkeleton.vue';

/** A user's posts, newest first, one page per `?page=`. */
const route = useRoute();
const username = computed(() => String(route.params.username));
const page = computed(() => pageFromQuery(route.query.page));
const { data, error, isPending, refetch } = useUserPostsQuery(username, page);
const posts = computed(() => data.value?.items ?? []);
</script>

<template>
  <QueryState :loading="isPending" :error="error" @retry="refetch()">
    <template #skeleton><ProfileTabSkeleton :rows="3" kind="list" /></template>
    <Card v-if="!posts.length" as="div">
      <EmptyState>{{ $t('profileTabs.noPosts') }}</EmptyState>
    </Card>
    <ul v-else class="flex flex-col gap-3">
      <li v-for="post in posts" :key="post.id">
        <ProfilePostRow :post="post" />
      </li>
    </ul>
    <NumberedPager
      v-if="data"
      :meta="data.meta"
      :label="$t('profileTabs.postsPager')"
      class="mt-4"
    />
  </QueryState>
</template>

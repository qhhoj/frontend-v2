<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import EmptyState from '@/components/EmptyState.vue';
import Card from '@/components/ui/Card.vue';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import RecentCommentRow from '@/features/community/RecentCommentRow.vue';
import { useUserCommentsQuery } from '@/features/users/users.queries';
import ProfileTabSkeleton from './ProfileTabSkeleton.vue';

/** Staff only: the router sends anyone without `USER_COMMENTS_PERMISSION` to the not-found page. */
const route = useRoute();
const username = computed(() => String(route.params.username));
const { data, error, isPending, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
  useUserCommentsQuery(username);
/** A right revoked since `/auth/me` was read: a retry cannot help, so the page says so with no retry. */
const isForbidden = computed(() => error.value instanceof ApiError && error.value.status === 403);
const comments = computed(() => data.value?.pages.flatMap((page) => page.items) ?? []);
/** One clock for the whole list, so every row ages together. */
const now = Date.now();
</script>

<template>
  <StatePanel v-if="isForbidden" kind="forbidden" :title="$t('profileTabs.commentsForbidden')" />
  <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
    <template #skeleton><ProfileTabSkeleton :rows="3" kind="list" /></template>
    <Card v-if="!comments.length" as="div">
      <EmptyState>{{ $t('profileTabs.noComments') }}</EmptyState>
    </Card>
    <ul v-else class="flex flex-col gap-4">
      <li v-for="comment in comments" :key="comment.id">
        <RecentCommentRow :comment="comment" :now="now" />
      </li>
    </ul>
    <div v-if="hasNextPage" class="mt-4 flex justify-center">
      <AppButton
        data-testid="older-comments"
        :aria-busy="isFetchingNextPage"
        @click="fetchNextPage()"
      >
        {{ $t('profileTabs.olderComments') }}
      </AppButton>
    </div>
  </QueryState>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import SubmitSignInLink from '@/features/problems/SubmitSignInLink.vue';
import RecentCommentRow from '@/features/community/RecentCommentRow.vue';
import { useUserCommentsQuery } from '@/features/users/users.queries';
import { hasPermission } from '@/lib/permissions';
import { useSessionStore } from '@/stores/session.store';
import ProfileTabSkeleton from './ProfileTabSkeleton.vue';

/** Who may list a user's comments: the same right the API checks. */
const COMMENTS_PERMISSION = 'judge.view_all_user_comment';
const route = useRoute();
const session = useSessionStore();
const username = computed(() => String(route.params.username));
const isSignedIn = computed(() => session.status === 'authenticated');
const isAllowed = computed(() => hasPermission(session.user, COMMENTS_PERMISSION));
// Idle without the right: the list is never asked for, so a viewer without it sees no request.
const { data, error, isPending, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
  useUserCommentsQuery(
    username,
    computed(() => isSignedIn.value && isAllowed.value),
  );
const isForbidden = computed(() => error.value instanceof ApiError && error.value.status === 403);
const comments = computed(() => data.value?.pages.flatMap((page) => page.items) ?? []);
/** One clock for the whole list, so every row ages together. */
const now = Date.now();
</script>

<template>
  <StatePanel v-if="!isSignedIn" kind="signIn" :title="$t('profileTabs.commentsSignIn')">
    <SubmitSignInLink label-key="profileTabs.signIn" />
  </StatePanel>
  <StatePanel
    v-else-if="!isAllowed || isForbidden"
    kind="forbidden"
    :title="$t('profileTabs.commentsForbidden')"
  />
  <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
    <template #skeleton><ProfileTabSkeleton :rows="3" kind="list" /></template>
    <GlassCard v-if="!comments.length" as="div">
      <EmptyState>{{ $t('profileTabs.noComments') }}</EmptyState>
    </GlassCard>
    <ul v-else class="flex flex-col gap-4">
      <li v-for="comment in comments" :key="comment.id">
        <RecentCommentRow :comment="comment" :now="now" />
      </li>
    </ul>
    <div v-if="hasNextPage" class="mt-4 flex justify-center">
      <button
        type="button"
        data-testid="older-comments"
        class="min-h-11 rounded-pill border border-line px-4 font-semibold hover:bg-surface-hover"
        :aria-busy="isFetchingNextPage"
        @click="fetchNextPage()"
      >
        {{ $t('profileTabs.olderComments') }}
      </button>
    </div>
  </QueryState>
</template>

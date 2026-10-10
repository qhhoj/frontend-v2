<script setup lang="ts">
import { computed } from 'vue';
import { ApiError } from '@/api/client';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import { usePageTitle } from '@/router/page-title';
import ProfileHeader from './ProfileHeader.vue';
import ProfileHeaderSkeleton from './ProfileHeaderSkeleton.vue';
import ProfileTabsNav from './ProfileTabsNav.vue';
import { useProfileUser } from './use-profile-user';

const { username, query } = useProfileUser();
const { data: user, isPending, error, refetch } = query;
const isMissing = computed(
  () => error.value instanceof ApiError && error.value.code === 'not_found',
);
usePageTitle(() => user.value?.username);
</script>

<template>
  <div class="page-column">
    <StatePanel
      v-if="isMissing"
      kind="notFound"
      is-page-heading
      :title="$t('profile.notFoundTitle')"
      :body="$t('profile.notFoundBody', { username })"
    >
      <RouterLink
        to="/users"
        class="inline-flex min-h-11 items-center rounded-pill border border-line px-5 font-semibold hover:bg-surface-hover"
      >
        {{ $t('profile.toLeaderboard') }}
      </RouterLink>
    </StatePanel>
    <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><ProfileHeaderSkeleton /></template>
      <template v-if="user">
        <nav :aria-label="$t('common.breadcrumb')" class="text-sm text-muted">
          <RouterLink to="/users" class="hover:underline">{{ $t('nav.users') }}</RouterLink> /
          {{ user.username }}
        </nav>
        <ProfileHeader :user="user" />
        <ProfileTabsNav :username="user.username" />
        <RouterView />
      </template>
    </QueryState>
  </div>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/client';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
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

/** A staff rename keeps the old name answering (backend `previousUsernames`): move the URL to the current name, same tab and query. */
const route = useRoute();
const router = useRouter();
watch(user, (shown) => {
  if (shown && shown.username.toLowerCase() !== username.value.toLowerCase())
    void router.replace({
      name: route.name!,
      params: { ...route.params, username: shown.username },
      query: route.query,
      hash: route.hash,
    });
});
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
      <AppButton to="/users">{{ $t('profile.toLeaderboard') }}</AppButton>
    </StatePanel>
    <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><ProfileHeaderSkeleton /></template>
      <template v-if="user">
        <PageHeader
          :title="user.username"
          :crumbs="[{ label: $t('nav.users'), to: '/users' }]"
          :back="{ to: '/users', label: $t('nav.users') }"
        />
        <ProfileHeader :user="user" />
        <ProfileTabsNav :username="user.username" />
        <RouterView />
      </template>
    </QueryState>
  </div>
</template>

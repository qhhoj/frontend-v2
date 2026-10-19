<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import AdminEditLink from '@/features/admin/edit-link/AdminEditLink.vue';
import { flatpageEditTarget } from '@/features/admin/edit-link/admin-edit-targets';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import StatePanel from '@/components/StatePanel.vue';
import QueryState from '@/components/QueryState.vue';
import UserContent from '@/components/UserContent.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { translate } from '@/i18n';
import NotFoundPage from '@/features/not-found/NotFoundPage.vue';
import { useSessionStore } from '@/stores/session.store';
import { usePageTitle } from '@/router/page-title';
import { safeRedirect } from '@/router/safe-redirect';
import { flatpagePath } from './flatpage-path';
import { useFlatpageQuery } from './flatpages.queries';

const route = useRoute();
const session = useSessionStore();
const path = computed(() => flatpagePath(route.params.pathMatch ?? ''));
const { data: page, isPending, error, refetch } = useFlatpageQuery(path);
const status = computed(() => (error.value instanceof ApiError ? error.value.status : null));
const isNotFound = computed(() => !path.value || status.value === 404);
const needsSignIn = computed(() => status.value === 401);
const loginTarget = computed(() => ({
  name: 'login',
  query: { redirect: safeRedirect(route.fullPath) },
}));
usePageTitle(() => (isNotFound.value ? translate('pages.notFound') : page.value?.title));
</script>

<template>
  <NotFoundPage v-if="isNotFound" />
  <StatePanel
    v-else-if="needsSignIn"
    kind="signIn"
    is-page-heading
    :title="$t('flatpage.signInTitle')"
    :body="$t('flatpage.signInBody')"
  >
    <AppButton tone="primary" :to="loginTarget">{{ $t('flatpage.signIn') }}</AppButton>
  </StatePanel>
  <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
    <template #skeleton>
      <div data-skeleton-region="flatpage" class="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-6">
        <SkeletonBlock text class="h-8 w-2/3" />
        <SkeletonBlock v-for="line in 10" :key="line" text class="h-4 w-full" />
      </div>
    </template>
    <article v-if="page" class="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-8">
      <PageHeader
        :title="page.title"
        :crumbs="[{ label: $t('flatpage.home'), to: '/' }, { label: page.title }]"
        :back="{ to: '/', label: $t('flatpage.home') }"
      >
        <template #actions><AdminEditLink :to="flatpageEditTarget(session.user)" /></template>
      </PageHeader>
      <UserContent :html="page.contentHtml" class="overflow-x-auto" />
    </article>
  </QueryState>
</template>

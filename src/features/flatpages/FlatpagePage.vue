<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import AdminEditLink from '@/features/admin/edit-link/AdminEditLink.vue';
import { flatpageEditTarget } from '@/features/admin/edit-link/admin-edit-targets';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import StatePanel from '@/components/StatePanel.vue';
import QueryState from '@/components/QueryState.vue';
import UserContent from '@/components/UserContent.vue';
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
    <RouterLink
      :to="loginTarget"
      class="bg-gradient-accent inline-flex min-h-11 items-center rounded-pill px-5 font-semibold text-on-accent"
    >
      {{ $t('flatpage.signIn') }}
    </RouterLink>
  </StatePanel>
  <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
    <template #skeleton>
      <div data-skeleton-region="flatpage" class="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-6">
        <SkeletonBlock text class="h-8 w-2/3" />
        <SkeletonBlock v-for="line in 10" :key="line" text class="h-4 w-full" />
      </div>
    </template>
    <article v-if="page" class="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-8">
      <nav :aria-label="$t('flatpage.breadcrumb')" class="text-sm text-muted">
        <RouterLink to="/" class="hover:underline">{{ $t('flatpage.home') }}</RouterLink>
        <span aria-hidden="true"> / </span>
        <span>{{ page.title }}</span>
      </nav>
      <div class="flex items-start gap-3">
        <h1 class="page-title min-w-0 flex-1">{{ page.title }}</h1>
        <AdminEditLink :to="flatpageEditTarget(session.user)" />
      </div>
      <UserContent :html="page.contentHtml" class="overflow-x-auto" />
    </article>
  </QueryState>
</template>

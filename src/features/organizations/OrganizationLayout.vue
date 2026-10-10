<script setup lang="ts">
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import { usePageTitle } from '@/router/page-title';
import OrganizationHeader from './OrganizationHeader.vue';
import OrganizationHeaderSkeleton from './OrganizationHeaderSkeleton.vue';
import OrganizationTabsNav from './OrganizationTabsNav.vue';
import { isNotFoundError, useOrganization } from './use-organization';

const { query } = useOrganization();
const organization = computed(() => query.data.value);
const isNotFound = computed(() => isNotFoundError(query.error.value));
usePageTitle(() => organization.value?.name);
</script>

<template>
  <div v-if="isNotFound" class="page-gutter py-6">
    <StatePanel
      kind="notFound"
      :title="$t('orgs.notFoundTitle')"
      :body="$t('orgs.notFoundBody')"
      is-page-heading
    >
      <RouterLink
        :to="{ name: 'organizations' }"
        class="inline-flex min-h-11 items-center rounded-pill border border-line px-5 font-semibold hover:bg-surface-hover"
      >
        {{ $t('orgs.backToList') }}
      </RouterLink>
    </StatePanel>
  </div>
  <div v-else class="page-column">
    <nav :aria-label="$t('orgs.breadcrumb')" class="text-sm text-muted">
      <RouterLink :to="{ name: 'organizations' }" class="hover:underline">
        {{ $t('orgs.title') }}
      </RouterLink>
      <template v-if="organization">
        / <span class="text-content">{{ organization.shortName }}</span>
      </template>
    </nav>
    <QueryState
      :loading="query.isPending.value"
      :error="query.error.value"
      @retry="query.refetch()"
    >
      <template #skeleton><OrganizationHeaderSkeleton /></template>
      <template v-if="organization">
        <OrganizationHeader :organization="organization" />
        <OrganizationTabsNav :organization="organization" />
      </template>
    </QueryState>
    <RouterView />
  </div>
</template>

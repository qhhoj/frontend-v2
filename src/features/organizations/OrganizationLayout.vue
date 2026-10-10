<script setup lang="ts">
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import { usePageTitle } from '@/router/page-title';
import OrganizationHeader from './OrganizationHeader.vue';
import OrganizationHeaderSkeleton from './OrganizationHeaderSkeleton.vue';
import OrganizationTabsNav from './OrganizationTabsNav.vue';
import { isNotFoundError, useOrganization, useOrganizationRank } from './use-organization';

const { slug, query } = useOrganization();
const organization = computed(() => query.data.value);
const rank = useOrganizationRank(slug, () => organization.value !== undefined);
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
  <div v-else class="flex flex-col">
    <div class="border-b border-line bg-surface-solid">
      <div class="page-gutter flex flex-col gap-5 pt-7">
        <RouterLink
          :to="{ name: 'organizations' }"
          class="w-fit text-sm text-accent-text hover:underline"
        >
          {{ $t('orgs.back') }}
        </RouterLink>
        <QueryState
          :loading="query.isPending.value"
          :error="query.error.value"
          @retry="query.refetch()"
        >
          <template #skeleton><OrganizationHeaderSkeleton /></template>
          <template v-if="organization">
            <OrganizationHeader :organization="organization" :rank="rank" />
            <OrganizationTabsNav :organization="organization" />
          </template>
        </QueryState>
      </div>
    </div>
    <div class="page-column">
      <RouterView />
    </div>
  </div>
</template>

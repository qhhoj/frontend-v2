<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type { JoinRequestState } from '@/api/types/organizations';
import { pageFromQuery } from '@/lib/paging';
import { searchQueryOf } from '../search/index-search';
import AdminFilterTabs from '../ui/AdminFilterTabs.vue';
import type { AdminFilterTab } from '../ui/AdminFilterTabs.vue';
import AdminFilterBar from '../ui/table/AdminFilterBar.vue';
import JoinRequestTable from './JoinRequestTable.vue';
import { useAllJoinRequestsQuery } from './join-requests.queries';
import { requestSearchOf, requestStateOf } from './organization-search';

/** The join requests of every organization (`?view=requests`): state switch, search, and one table. */
const STATES: JoinRequestState[] = ['P', 'A', 'R'];
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const state = computed(() => requestStateOf(route.query));
const page = computed(() => pageFromQuery(route.query.page));
const search = computed(() => requestSearchOf(route.query));
const list = useAllJoinRequestsQuery(state, page, search);
const searchText = computed({
  get: () => search.value,
  set: (text: string) => void router.replace({ query: searchQueryOf(route.query, { q: text }) }),
});

/** A state tab keeps the search and returns to page 1. */
const stateTabs = computed<AdminFilterTab[]>(() =>
  STATES.map((next) => ({
    key: next,
    label: t(`admin.organizations.queue.states.${next}`),
    to: {
      query: {
        view: 'requests',
        ...(next === 'P' ? {} : { state: next }),
        ...(search.value ? { q: search.value } : {}),
      },
    },
  })),
);
const resultText = computed(() =>
  t(`admin.organizations.queue.count.${state.value}`, {
    total: list.data.value?.meta.total ?? 0,
  }),
);
</script>

<template>
  <section
    data-testid="queue"
    :aria-label="$t('admin.organizations.queue.title')"
    class="flex min-w-0 flex-col gap-3"
  >
    <AdminFilterBar
      v-model:search="searchText"
      :search-label="$t('admin.organizations.queue.search.label')"
      :result-text="resultText"
    >
      <template #view>
        <AdminFilterTabs
          :tabs="stateTabs"
          :current="state"
          :label="$t('admin.organizations.queue.states.label')"
        />
      </template>
    </AdminFilterBar>
    <JoinRequestTable
      :rows="list.data.value?.items ?? []"
      :state="state"
      with-organization
      :label="$t('admin.organizations.queue.title')"
      :loading="list.isPending.value"
      :error="list.error.value"
      :meta="list.data.value?.meta"
      :pager-label="$t('admin.organizations.queue.pager')"
      :filtered="search !== ''"
      @retry="list.refetch()"
      @clear-filters="searchText = ''"
    />
  </section>
</template>

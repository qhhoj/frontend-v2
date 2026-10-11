<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import AdminFilterTabs from '../ui/AdminFilterTabs.vue';
import IndexSearchBox from '../search/IndexSearchBox.vue';
import { ADMIN_INPUT_CLASS } from '../ui/classes';
import { USERS_SORTS, USERS_TABS, usersViewToQuery } from './users-list';
import type { UsersListView, UsersSort, UsersTab } from './users-list';

const props = defineProps<{ view: UsersListView; status: string }>();
const emit = defineEmits<{ change: [patch: Partial<UsersListView>] }>();
const route = useRoute();
const { t } = useI18n();

const tabLocation = (tab: UsersTab) => ({
  name: 'admin-users',
  query: usersViewToQuery({ ...props.view, tab, page: 1 }, route.query),
});
const tabs = computed(() =>
  USERS_TABS.map((tab) => ({
    key: tab,
    label: t(`admin.users.list.tabs.${tab}`),
    to: tabLocation(tab),
    testid: `tab-${tab}`,
  })),
);
</script>

<template>
  <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
    <AdminFilterTabs :tabs="tabs" :current="view.tab" :label="$t('admin.users.list.tabs.label')" />
    <label class="flex flex-col gap-1 text-sm text-muted lg:w-48">
      {{ $t('admin.users.list.sort.label') }}
      <select
        data-testid="users-sort"
        :class="ADMIN_INPUT_CLASS"
        :value="view.sort"
        @change="
          emit('change', {
            sort: ($event.target as HTMLSelectElement).value as UsersSort,
            page: 1,
          })
        "
      >
        <option v-for="sort in USERS_SORTS" :key="sort" :value="sort">
          {{ $t(`admin.users.list.sort.${sort}`) }}
        </option>
      </select>
    </label>
    <div class="lg:w-80">
      <IndexSearchBox
        :value="view.search"
        :label="$t('admin.users.list.search.label')"
        :placeholder="$t('admin.users.list.search.placeholder')"
        :clear-label="$t('admin.users.list.search.clear')"
        :hint="$t('admin.users.list.search.hint')"
        :status="status"
        @commit="(search) => emit('change', { search, page: 1 })"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import IndexSearchBox from '../search/IndexSearchBox.vue';
import { USERS_TABS, usersViewToQuery } from './users-list';
import type { UsersListView, UsersTab } from './users-list';

const props = defineProps<{ view: UsersListView; status: string }>();
const emit = defineEmits<{ change: [patch: Partial<UsersListView>] }>();
const route = useRoute();

const tabLocation = (tab: UsersTab) => ({
  name: 'admin-users',
  query: usersViewToQuery({ ...props.view, tab, page: 1 }, route.query),
});
</script>

<template>
  <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
    <nav :aria-label="$t('admin.users.list.tabs.label')" class="flex flex-wrap gap-2">
      <RouterLink
        v-for="tab in USERS_TABS"
        :key="tab"
        :to="tabLocation(tab)"
        :data-testid="`tab-${tab}`"
        :aria-current="tab === view.tab ? 'page' : undefined"
        class="inline-flex min-h-11 items-center rounded-pill border px-4 text-sm font-semibold"
        :class="
          tab === view.tab
            ? 'border-accent bg-accent-soft text-accent-soft-text'
            : 'border-line text-muted hover:text-content'
        "
      >
        {{ $t(`admin.users.list.tabs.${tab}`) }}
      </RouterLink>
    </nav>
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

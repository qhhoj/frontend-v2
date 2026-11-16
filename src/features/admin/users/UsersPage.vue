<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { STAFF_USERS_PAGE_SIZE } from '@/api/users-admin.api';
import EmptyState from '@/components/EmptyState.vue';
import { ADMIN_BIT_KINDS } from '../shell/admin-bit';
import AdminFilterTabs from '../ui/AdminFilterTabs.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import { BUTTON } from '../ui/controls';
import AdminFilterBar from '../ui/table/AdminFilterBar.vue';
import { useSessionStore } from '@/stores/session.store';
import { usePermissions } from '@/stores/use-permissions';
import RolesDialog from './RolesDialog.vue';
import UserCreateDialog from './UserCreateDialog.vue';
import UserDrawer from './UserDrawer.vue';
import UsersTable from './UsersTable.vue';
import {
  STAFF_USERS_MAX_PAGE,
  USERS_TABS,
  staffUsersQueryOf,
  userLockOf,
  usersViewFromQuery,
  usersViewToQuery,
} from './users-list';
import type { UsersListView, UsersSort } from './users-list';
import { useStaffUsersQuery } from './users.queries';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const view = computed(() => usersViewFromQuery(route.query));
const list = useStaffUsersQuery(() => staffUsersQueryOf(view.value));
const users = computed(() => list.data.value?.items ?? []);
/** The pager stops at the deepest page the backend serves. */
const meta = computed(() => {
  const loaded = list.data.value?.meta;
  if (!loaded) return undefined;
  return { ...loaded, total: Math.min(loaded.total, STAFF_USERS_MAX_PAGE * loaded.pageSize) };
});
const countText = computed(() => {
  if (!list.data.value) return undefined;
  const kind = view.value.search ? 'match' : view.value.tab;
  return t(`admin.users.list.count.${kind}`, {
    total: list.data.value.meta.total,
    pageSize: STAFF_USERS_PAGE_SIZE,
    search: view.value.search,
  });
});
const opened = computed(() => {
  const value = route.query.user;
  return typeof value === 'string' && value !== '' ? value : null;
});

/** Filters, search and sort live in the URL; a new one starts again on page 1. */
const setView = (patch: Partial<UsersListView>) =>
  router.replace({
    name: 'admin-users',
    query: usersViewToQuery({ ...view.value, page: 1, ...patch }, route.query),
  });
const search = computed({
  get: () => view.value.search,
  set: (text: string) => void setView({ search: text.trim() }),
});
const sort = computed({
  get: () => (view.value.sort === 'default' ? undefined : view.value.sort),
  set: (value: string | undefined) => void setView({ sort: (value ?? 'default') as UsersSort }),
});
const tabs = computed(() =>
  USERS_TABS.map((tab) => ({
    key: tab,
    label: t(`admin.users.list.tabs.${tab}`),
    to: { name: 'admin-users', query: usersViewToQuery({ ...view.value, tab, page: 1 }, {}) },
    testid: `tab-${tab}`,
  })),
);
/** The typed name opens as an exact username (Enter), whether or not the prefix list shows it. */
const exact = computed(() =>
  view.value.search
    ? {
        label: t('admin.users.list.openExact', { username: view.value.search }),
        to: { query: { ...route.query, user: view.value.search } },
      }
    : null,
);

/** Opening a user only sets `?user=`; the list's place stays in the URL. */
const openUser = (username: string) =>
  router.push({ name: 'admin-users', query: { ...route.query, user: username } });
const session = useSessionStore();
const { can, isSuperuser } = usePermissions();
const locks = computed(() =>
  Object.fromEntries(
    users.value.map((user) => [
      user.id,
      userLockOf(user, { id: session.user?.id, isSuperuser: isSuperuser.value }),
    ]),
  ),
);
const isCreateOpen = ref(false);
const isRolesOpen = ref(false);
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminPageHeader :title="$t('admin.shell.screens.users')" :lead="$t('admin.users.lead')">
      <template #actions>
        <button
          v-if="can('judge.change_profile')"
          type="button"
          :class="BUTTON.secondary"
          @click="isRolesOpen = true"
        >
          {{ $t('admin.users.roles.open') }}
        </button>
        <button
          v-if="can('auth.add_user')"
          type="button"
          :class="BUTTON.primary"
          @click="isCreateOpen = true"
        >
          {{ $t('admin.users.create.open') }}
        </button>
      </template>
    </AdminPageHeader>
    <div class="flex flex-col gap-3">
      <AdminFilterBar
        v-model:search="search"
        :search-label="$t('admin.users.list.search.label')"
        :result-text="countText"
        :exact="exact"
      >
        <template #view>
          <AdminFilterTabs
            :tabs="tabs"
            :current="view.tab"
            :label="$t('admin.users.list.tabs.label')"
          />
        </template>
      </AdminFilterBar>
      <UsersTable
        v-model:sort="sort"
        :users="users"
        :meta="meta"
        :show-reason="view.tab === 'banned'"
        :loading="list.isPending.value"
        :error="list.error.value"
        :locks="locks"
        @open="openUser"
        @retry="list.refetch()"
      >
        <template #empty>
          <EmptyState compact :kind="ADMIN_BIT_KINDS.empty">
            {{
              view.search
                ? $t('admin.users.list.emptySearch', { search: view.search })
                : $t('admin.users.list.empty')
            }}
          </EmptyState>
        </template>
      </UsersTable>
    </div>
    <UserDrawer v-if="opened" :key="opened" :username="opened" />
    <UserCreateDialog v-if="isCreateOpen" v-model:visible="isCreateOpen" />
    <RolesDialog v-if="isRolesOpen" v-model:visible="isRolesOpen" />
  </div>
</template>

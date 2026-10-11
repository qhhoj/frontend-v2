<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { STAFF_USERS_PAGE_SIZE } from '@/api/users-admin.api';
import EmptyState from '@/components/EmptyState.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AdminBit from '../shell/AdminBit.vue';
import { ADMIN_BIT_KINDS } from '../shell/admin-bit';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import ExactLookup from '../ui/ExactLookup.vue';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import { usePermissions } from '@/stores/use-permissions';
import RolesDialog from './RolesDialog.vue';
import UserCreateDialog from './UserCreateDialog.vue';
import UserLookupCard from './UserLookupCard.vue';
import UsersFilters from './UsersFilters.vue';
import UsersTable from './UsersTable.vue';
import {
  lastStaffPage,
  staffUsersQueryOf,
  usersViewFromQuery,
  usersViewToQuery,
} from './users-list';
import type { UsersListView } from './users-list';
import { useStaffUsersQuery } from './users.queries';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const view = computed(() => usersViewFromQuery(route.query));
const list = useStaffUsersQuery(() => staffUsersQueryOf(view.value));
const users = computed(() => list.data.value?.items ?? []);
const total = computed(() => list.data.value?.meta.total ?? 0);
const last = computed(() => lastStaffPage(total.value));
const showReason = computed(() => view.value.tab === 'banned');
const countKind = computed(() => (view.value.search ? 'match' : view.value.tab));
const countText = computed(() =>
  t(`admin.users.list.count.${countKind.value}`, {
    total: total.value,
    pageSize: STAFF_USERS_PAGE_SIZE,
    search: view.value.search,
  }),
);
const opened = computed(() => {
  const value = route.query.user;
  return typeof value === 'string' && value !== '' ? value : null;
});

/** Filters, search and page live in the URL; a new filter or search starts again on page 1. */
const setView = (patch: Partial<UsersListView>) =>
  router.replace({
    name: 'admin-users',
    query: usersViewToQuery({ ...view.value, ...patch }, route.query),
  });
/** Opening a user (the lookup or a row) only sets `?user=`; the list's place stays in the URL. */
const openUser = (username: string) =>
  router.push({ name: 'admin-users', query: { ...route.query, user: username } });
const { can } = usePermissions();
const isCreateOpen = ref(false);
const isRolesOpen = ref(false);
</script>

<template>
  <div class="flex flex-col gap-5">
    <AdminPageHeader :title="$t('admin.shell.screens.users')" :lead="$t('admin.users.lead')">
      <template #actions>
        <button
          v-if="can('judge.change_profile')"
          type="button"
          :class="ADMIN_BUTTON_CLASS"
          @click="isRolesOpen = true"
        >
          {{ $t('admin.users.roles.open') }}
        </button>
        <button
          v-if="can('auth.add_user')"
          type="button"
          :class="ADMIN_BUTTON_CLASS"
          @click="isCreateOpen = true"
        >
          {{ $t('admin.users.create.open') }}
        </button>
        <AdminBit placement="people" />
      </template>
    </AdminPageHeader>
    <section class="glass rounded-panel p-5">
      <ExactLookup
        :label="$t('admin.users.lookup.label')"
        :submit-label="$t('admin.users.lookup.submit')"
        :hint="$t('admin.users.lookup.hint')"
        @open="openUser"
      />
    </section>
    <section class="glass flex flex-col gap-4 rounded-panel p-5">
      <UsersFilters :view="view" :status="list.data.value ? countText : ''" @change="setView" />
      <QueryState :loading="list.isPending.value" :error="list.error.value" @retry="list.refetch()">
        <template #skeleton
          ><SkeletonBlock data-skeleton-region="users-list" class="h-[19rem] w-full"
        /></template>
        <EmptyState v-if="users.length === 0" compact :kind="ADMIN_BIT_KINDS.empty">
          {{
            view.search
              ? $t('admin.users.list.emptySearch', { search: view.search })
              : $t('admin.users.list.empty')
          }}
        </EmptyState>
        <UsersTable
          v-else
          :users="users"
          :show-reason="showReason"
          :selected="opened"
          @open="openUser"
        />
      </QueryState>
      <div v-if="list.data.value" class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <nav class="flex items-center gap-3" :aria-label="$t('admin.users.list.pager')">
            <button
              type="button"
              :class="ADMIN_BUTTON_CLASS"
              :disabled="view.page <= 1"
              @click="setView({ page: view.page - 1 })"
            >
              {{ $t('admin.users.list.previous') }}
            </button>
            <span class="text-sm">{{
              $t('admin.users.list.pageOf', { page: view.page, last })
            }}</span>
            <button
              type="button"
              :class="ADMIN_BUTTON_CLASS"
              :disabled="view.page >= last"
              @click="setView({ page: view.page + 1 })"
            >
              {{ $t('admin.users.list.next') }}
            </button>
          </nav>
          <p class="text-sm text-muted">{{ countText }}</p>
        </div>
        <p class="text-xs text-muted">{{ $t('admin.users.list.order') }}</p>
      </div>
    </section>
    <UserLookupCard v-if="opened" :key="opened" :username="opened" />
    <UserCreateDialog v-if="isCreateOpen" v-model:visible="isCreateOpen" />
    <RolesDialog v-if="isRolesOpen" v-model:visible="isRolesOpen" />
  </div>
</template>

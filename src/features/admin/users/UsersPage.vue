<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { pageFromQuery } from '@/lib/paging';
import { formatDate } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminBit from '../shell/AdminBit.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import ExactLookup from '../ui/ExactLookup.vue';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import UserLookupCard from './UserLookupCard.vue';
import { lastStaffPage, STAFF_USERS_MAX_PAGE } from './users-list';
import { useStaffUsersQuery } from './users.queries';

const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
const page = computed(() => Math.min(pageFromQuery(route.query.page), STAFF_USERS_MAX_PAGE));
const list = useStaffUsersQuery(() => ({ page: page.value }));
const users = computed(() => list.data.value?.items ?? []);
const last = computed(() => lastStaffPage(list.data.value?.meta.total ?? 0));
const opened = computed(() => {
  const value = route.query.user;
  return typeof value === 'string' && value !== '' ? value : null;
});

/** Opening a user (the lookup or a row) only sets `?user=`; the page of the list stays in the URL. */
const openUser = (username: string) =>
  router.push({ name: 'admin-users', query: { ...route.query, user: username } });
const goToPage = (next: number) =>
  router.push({
    name: 'admin-users',
    query: { ...route.query, page: next > 1 ? String(next) : undefined },
  });
</script>

<template>
  <div class="flex flex-col gap-5 px-4 py-6 sm:px-8">
    <AdminPageHeader
      :crumbs="[{ label: $t('admin.shell.screens.users') }]"
      :title="$t('admin.shell.screens.users')"
      :lead="$t('admin.users.lead')"
    >
      <template #actions><AdminBit placement="people" /></template>
    </AdminPageHeader>
    <section class="glass rounded-panel p-5">
      <ExactLookup
        :label="$t('admin.users.lookup.label')"
        :submit-label="$t('admin.users.lookup.submit')"
        :hint="$t('admin.users.lookup.hint')"
        @open="openUser"
      />
    </section>
    <div class="grid items-start gap-5 lg:grid-cols-2">
      <section class="glass flex flex-col gap-4 rounded-panel p-5">
        <QueryState
          :loading="list.isPending.value"
          :error="list.error.value"
          @retry="list.refetch()"
        >
          <template #skeleton><SkeletonBlock class="h-48 w-full" /></template>
          <p v-if="users.length === 0" class="text-muted">{{ $t('admin.users.list.empty') }}</p>
          <div
            v-else
            role="region"
            tabindex="0"
            :aria-label="$t('admin.users.list.region')"
            class="overflow-x-auto"
          >
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="text-muted">
                  <th scope="col" class="px-2 py-2 font-semibold">
                    {{ $t('admin.users.list.columns.user') }}
                  </th>
                  <th scope="col" class="px-2 py-2 font-semibold">
                    {{ $t('admin.users.list.columns.rank') }}
                  </th>
                  <th scope="col" class="px-2 py-2 font-semibold">
                    {{ $t('admin.users.list.columns.joined') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="user in users"
                  :key="user.id"
                  data-testid="user-row"
                  class="border-t border-line"
                >
                  <td class="px-2 py-2">
                    <button
                      type="button"
                      class="min-h-11 min-w-0 text-start"
                      :aria-pressed="user.username === opened"
                      @click="openUser(user.username)"
                    >
                      <AdminUserLabel
                        :username="user.username"
                        :link="false"
                        :status="user.displayRank === 'banned' ? 'banned' : 'active'"
                      />
                    </button>
                    <p v-if="user.banReason" class="text-xs text-negative">
                      {{ $t('admin.users.list.banReason', { reason: user.banReason }) }}
                    </p>
                  </td>
                  <td class="px-2 py-2">{{ user.displayRank }}</td>
                  <td class="px-2 py-2">{{ formatDate(user.dateJoined, locale.locale) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </QueryState>
        <nav
          class="flex items-center justify-between gap-3"
          :aria-label="$t('admin.users.list.pager')"
        >
          <button
            type="button"
            :class="ADMIN_BUTTON_CLASS"
            :disabled="page <= 1"
            @click="goToPage(page - 1)"
          >
            {{ $t('admin.users.list.previous') }}
          </button>
          <span class="text-sm">{{ $t('admin.users.list.pageOf', { page, last }) }}</span>
          <button
            type="button"
            :class="ADMIN_BUTTON_CLASS"
            :disabled="page >= last"
            @click="goToPage(page + 1)"
          >
            {{ $t('admin.users.list.next') }}
          </button>
        </nav>
      </section>
      <UserLookupCard v-if="opened" :key="opened" :username="opened" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatAgo, formatDate, formatNumericDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import { userStatusOf } from './users-list';
import type { StaffUser } from '@/api/types/users-admin';

defineProps<{ users: StaffUser[]; showReason: boolean; selected: string | null }>();
const emit = defineEmits<{ open: [username: string] }>();
const locale = useLocaleStore();
const now = Date.now();
</script>

<template>
  <div
    role="region"
    tabindex="0"
    :aria-label="$t('admin.users.list.region')"
    class="overflow-x-auto"
  >
    <table class="w-full min-w-[40rem] text-left text-sm">
      <thead>
        <tr class="text-muted">
          <th scope="col" class="px-2 py-2 font-semibold">
            {{ $t('admin.users.list.columns.user') }}
          </th>
          <th scope="col" class="px-2 py-2 font-semibold">
            {{ $t('admin.users.list.columns.rank') }}
          </th>
          <th scope="col" class="px-2 py-2 font-semibold">
            {{
              showReason
                ? $t('admin.users.list.columns.banReason')
                : $t('admin.users.list.columns.joined')
            }}
          </th>
          <th scope="col" class="px-2 py-2 font-semibold">
            {{ $t('admin.users.list.columns.lastAccess') }}
          </th>
          <th scope="col" class="sr-only">{{ $t('admin.users.list.columns.open') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="user in users"
          :key="user.id"
          data-testid="user-row"
          class="border-t border-line align-top"
        >
          <td class="px-2 py-2">
            <AdminUserLabel
              :username="user.username"
              :link="false"
              :status="userStatusOf(user) === 'banned' ? 'banned' : 'active'"
            />
            <p v-if="user.displayName !== user.username" class="text-xs text-muted">
              {{ user.displayName }}
            </p>
          </td>
          <td class="px-2 py-2">
            <p>
              {{
                $te(`admin.users.ranks.${user.displayRank}`)
                  ? $t(`admin.users.ranks.${user.displayRank}`)
                  : user.displayRank
              }}
            </p>
            <p class="flex flex-wrap gap-1 text-xs">
              <span v-if="user.isSuperuser" class="rounded-pill border border-line px-2">
                {{ $t('admin.users.list.status.superuser') }}
              </span>
              <span v-else-if="user.isStaff" class="rounded-pill border border-line px-2">
                {{ $t('admin.users.list.status.staff') }}
              </span>
              <span
                v-if="userStatusOf(user) === 'banned'"
                class="rounded-pill border border-negative px-2 text-negative"
              >
                {{ $t('admin.users.list.status.banned') }}
              </span>
              <span
                v-else-if="userStatusOf(user) === 'inactive'"
                class="rounded-pill border border-line px-2 text-muted"
              >
                {{ $t('admin.users.list.status.inactive') }}
              </span>
            </p>
          </td>
          <td class="px-2 py-2">
            <template v-if="showReason">
              {{ user.banReason ?? $t('admin.users.list.reasonNone') }}
            </template>
            <template v-else>{{ formatDate(user.dateJoined, locale.locale) }}</template>
          </td>
          <td class="px-2 py-2">
            <template v-if="user.lastAccess">
              <p>{{ formatAgo(user.lastAccess, now, locale.locale) }}</p>
              <p class="font-mono text-xs text-muted">
                {{ formatNumericDateTime(user.lastAccess, locale.locale) }}
              </p>
            </template>
            <p v-else class="text-muted">{{ $t('admin.users.list.neverAccessed') }}</p>
          </td>
          <td class="px-2 py-2">
            <button
              type="button"
              :class="[ADMIN_BUTTON_CLASS, 'min-h-11']"
              :aria-pressed="user.username === selected"
              :aria-label="$t('admin.users.list.openUser', { username: user.username })"
              @click="emit('open', user.username)"
            >
              {{ $t('admin.users.list.columns.open') }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

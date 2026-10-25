<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Lock } from 'lucide-vue-next';
import type { TotalPageMeta } from '@/api/client';
import type { StaffUser } from '@/api/types/users-admin';
import { formatAgo, formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import AdminChip from '../ui/AdminChip.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { buttonClass } from '../ui/controls';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../ui/table/table-columns';
import { memberRoleLabel } from './display-rank';
import UserStatusChips from './UserStatusChips.vue';
import { userStatusOf } from './users-list';
import type { UserLock } from './users-list';

/** The staff user list: one row (a card on a phone) per account, "Sửa" opens the drawer unless the row is locked. */
const props = defineProps<{
  users: StaffUser[];
  meta?: TotalPageMeta;
  showReason: boolean;
  loading: boolean;
  error: unknown;
  /** Why a row cannot be opened, by user id (`userLockOf`); absent or null: it can. */
  locks: Record<string, UserLock>;
}>();
const sort = defineModel<string | undefined>('sort');
const emit = defineEmits<{ open: [username: string]; retry: [] }>();
const { t } = useI18n();
const locale = useLocaleStore();
const now = Date.now();

const columns = computed<AdminColumn[]>(() => [
  { key: 'user', label: t('admin.users.list.columns.user'), priority: 'primary' },
  { key: 'role', label: t('admin.users.list.columns.role') },
  { key: 'status', label: t('admin.users.list.columns.status'), priority: 'badge' },
  props.showReason
    ? { key: 'banReason', label: t('admin.users.list.columns.banReason'), cellClass: 'max-w-80' }
    : { key: 'joined', label: t('admin.users.list.columns.joined') },
  {
    key: 'lastAccess',
    label: t('admin.users.list.columns.lastAccess'),
    sort: { asc: 'lastAccess', desc: '-lastAccess', first: 'desc' },
  },
]);
</script>

<template>
  <AdminDataTable
    v-model:sort="sort"
    :pager="meta ? { meta, label: $t('admin.users.list.pager') } : undefined"
    :columns="columns"
    :rows="users"
    :row-key="(user) => user.id"
    :row-label="(user) => user.username"
    :row-attrs="() => ({ 'data-testid': 'user-row' })"
    :label="$t('admin.users.list.region')"
    :loading="loading"
    :error="error"
    @retry="emit('retry')"
  >
    <template #cell-user="{ row }">
      <div class="flex min-w-0 flex-col">
        <AdminUserLabel
          :username="row.username"
          :rating="row.rating"
          :link="false"
          :status="userStatusOf(row) === 'banned' ? 'banned' : 'active'"
        />
        <span v-if="row.displayName !== row.username" class="truncate text-xs text-muted">
          {{ row.displayName }}
        </span>
      </div>
    </template>
    <template #cell-role="{ row }">
      <AdminChip v-if="row.isSuperuser" tone="accent">
        {{ $t('admin.users.list.status.superuser') }}
      </AdminChip>
      <AdminChip v-else-if="row.isStaff" tone="info">
        {{ $t('admin.users.list.status.staff') }}
      </AdminChip>
      <span v-else class="text-muted">{{ memberRoleLabel(row.displayRank) }}</span>
    </template>
    <template #cell-status="{ row }"><UserStatusChips :status="userStatusOf(row)" /></template>
    <template #cell-banReason="{ row }">
      <span class="line-clamp-2">{{ row.banReason ?? $t('admin.users.list.reasonNone') }}</span>
    </template>
    <template #cell-joined="{ row }">
      <span class="whitespace-nowrap">{{ formatDate(row.dateJoined, 'date', locale.locale) }}</span>
    </template>
    <template #cell-lastAccess="{ row }">
      <span
        v-if="row.lastAccess"
        class="whitespace-nowrap"
        :title="formatDate(row.lastAccess, 'datetime', locale.locale)"
      >
        {{ formatAgo(row.lastAccess, now, locale.locale) }}
      </span>
      <span v-else class="text-muted">{{ $t('admin.users.list.neverAccessed') }}</span>
    </template>
    <template #actions="{ row }">
      <button
        v-if="!locks[row.id]"
        type="button"
        data-testid="user-edit-open"
        :class="buttonClass('secondary', 'sm')"
        :aria-label="$t('admin.users.list.openUser', { username: row.username })"
        @click="emit('open', row.username)"
      >
        {{ $t('common.edit') }}
      </button>
      <span
        v-else
        class="inline-flex items-center gap-1 px-2 text-xs text-muted"
        :title="$t(`admin.users.edit.locked.${locks[row.id]}`)"
      >
        <Lock aria-hidden="true" class="size-3.5" :stroke-width="1.75" />
        {{ $t(`admin.users.list.locked.${locks[row.id]}`) }}
      </span>
    </template>
    <template #empty><slot name="empty" /></template>
  </AdminDataTable>
</template>

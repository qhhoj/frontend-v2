<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { OrganizationMember } from '@/api/types/organizations';
import UserName from '@/components/UserName.vue';
import DataTable from '@/components/ui/DataTable.vue';
import type { DataTableColumn } from '@/components/ui/DataTableColumns';
import { formatNumber } from '@/lib/format';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { useLocaleStore } from '@/stores/locale.store';
import type { MemberColumn } from './MemberRows.vue';

/** The members tab's table (the overview card keeps the compact `MemberRows`). Columns after the first hide below `md`: a narrow screen keeps rank, user and the first number. A row opens the profile. */
const props = defineProps<{ members: OrganizationMember[]; columns: MemberColumn[] }>();
const { t } = useI18n();
const locale = useLocaleStore();
const AVATAR_PX = 24;
const tableColumns = computed<DataTableColumn[]>(() => [
  { key: 'rank', label: t('orgs.columns.rank'), align: 'end' },
  { key: 'user', label: t('orgs.columns.user'), priority: 'primary' },
  ...props.columns.map((column, index) => ({
    key: column,
    label: t(`orgs.columns.${column}`),
    align: 'end' as const,
    hideBelow: index > 0 ? ('md' as const) : undefined,
  })),
]);
const formattedValue = (member: OrganizationMember, column: MemberColumn) =>
  formatNumber(member[column], locale.locale);
</script>

<template>
  <DataTable
    :columns="tableColumns"
    :rows="members"
    :row-key="(member) => member.id"
    :row-to="(member) => ({ name: 'user', params: { username: member.username } })"
    :label="$t('orgMembership.membersTable')"
    stack="scroll"
    :sticky-columns="0"
  >
    <template #cell-rank="{ row }">{{ formatNumber(row.rank, locale.locale) }}</template>
    <template #cell-user="{ row }">
      <span class="flex min-w-0 items-center gap-2">
        <UserAvatar :username="row.username" :size="AVATAR_PX" class="shrink-0" />
        <span class="flex min-w-0 flex-col">
          <UserName
            :username="row.username"
            :rating="row.rating"
            class="truncate"
            :title="row.username"
          />
          <span v-if="row.displayName !== row.username" class="truncate text-sm text-muted">
            {{ row.displayName }}
          </span>
        </span>
      </span>
    </template>
    <template v-for="column in columns" :key="column" #[`cell-${column}`]="{ row }">
      {{ formattedValue(row, column) }}
    </template>
  </DataTable>
</template>

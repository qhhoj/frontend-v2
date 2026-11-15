<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { OrganizationListItem } from '@/api/types/organizations';
import CompactListRow from '@/components/CompactListRow.vue';
import Chip from '@/components/ui/Chip.vue';
import DataTable from '@/components/ui/DataTable.vue';
import type { DataTableColumn } from '@/components/ui/DataTableColumns';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import OrganizationJoinChip from './OrganizationJoinChip.vue';
import OrganizationLogo from './OrganizationLogo.vue';

/**
 * The organizations list: one dense row per organization, the whole row opens it. On a phone each row is two lines:
 * name and short name, then how to join and the member count. The viewer's own organizations carry a "Đã tham gia" mark.
 */
const props = defineProps<{
  organizations: OrganizationListItem[];
  memberIds: ReadonlySet<string>;
}>();
const { t } = useI18n();
const locale = useLocaleStore();
const target = (organization: OrganizationListItem) => ({
  name: 'organization',
  params: { slug: organization.slug },
});
const members = (organization: OrganizationListItem) =>
  formatNumber(organization.memberCount, locale.locale);
const columns = computed<DataTableColumn[]>(() => [
  { key: 'name', label: t('orgs.columns.organization'), priority: 'primary' },
  { key: 'memberCount', label: t('orgs.membersLabel'), align: 'end' },
  { key: 'join', label: t('orgs.columns.join') },
  { key: 'mine', label: t('orgs.filters.mine'), hideLabel: true, cellClass: 'w-px' },
]);
</script>

<template>
  <DataTable
    :columns="columns"
    :rows="props.organizations"
    :row-key="(organization) => organization.id"
    :row-to="target"
    :row-attrs="() => ({ 'data-testid': 'organization-row' })"
    :label="$t('orgs.title')"
    density="compact"
    stack="card"
    :stack-below="640"
  >
    <template #cell-name="{ row }">
      <span class="flex min-w-0 items-center gap-2">
        <OrganizationLogo :organization="row" size="sm" />
        <RouterLink :to="target(row)" class="min-w-0 truncate font-semibold hover:underline">
          {{ row.name }}
        </RouterLink>
        <span class="shrink-0 font-mono text-caption text-muted">{{ row.shortName }}</span>
        <Chip v-if="row.isUnlisted" size="sm" class="shrink-0">{{ $t('orgs.unlisted') }}</Chip>
      </span>
    </template>
    <template #cell-memberCount="{ row }">{{ members(row) }}</template>
    <template #cell-join="{ row }"
      ><OrganizationJoinChip :is-open="row.isOpen" size="sm"
    /></template>
    <template #cell-mine="{ row }">
      <Chip v-if="memberIds.has(row.id)" tone="success" size="sm">{{ $t('orgs.act.joined') }}</Chip>
    </template>
    <template #card="{ row }">
      <CompactListRow data-testid="organization-row" :to="target(row)" :title="row.name">
        <template #meta>
          <span class="font-mono">{{ row.shortName }}</span>
          · {{ $t('orgs.membersMeta', { count: members(row) }) }}
        </template>
        <template #trail>
          <OrganizationJoinChip :is-open="row.isOpen" size="sm" />
          <Chip v-if="memberIds.has(row.id)" tone="success" size="sm">
            {{ $t('orgs.act.joined') }}
          </Chip>
        </template>
      </CompactListRow>
    </template>
  </DataTable>
</template>

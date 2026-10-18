<script setup lang="ts">
import { computed, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type { NumberedPageMeta } from '@/api/client';
import type { LeaderboardEntry, LeaderboardSort, RankField } from '@/api/types/users';
import StatePanel from '@/components/StatePanel.vue';
import StateBit from '@/components/StateBit.vue';
import ToolbarSelect from '@/components/ToolbarSelect.vue';
import UserName from '@/components/UserName.vue';
import Chip from '@/components/ui/Chip.vue';
import DataTable from '@/components/ui/DataTable.vue';
import type { DataTableColumn } from '@/components/ui/DataTableColumns';
import { formatNumber } from '@/lib/format';
import { medalClass } from '@/lib/medal';
import { WIDE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { useLocaleStore } from '@/stores/locale.store';
import { boardColumns, rowAnchor, sortLocation } from './leaderboard-columns';
import { revealRow } from './reveal-row';

/**
 * The board: the kit `DataTable` (48 px rows). From `lg` up all five number columns show and any heading sorts; below it
 * only the sorted number shows, and a select above the table sorts. A heading sorts one way, highest first.
 */
const props = defineProps<{
  entries: LeaderboardEntry[];
  sort: LeaderboardSort;
  viewerName: string | null;
  loading: boolean;
  error: unknown;
  meta: NumberedPageMeta | undefined;
}>();
defineEmits<{ retry: [] }>();
const AVATAR_PX = 28;
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
const isWide = useMediaQuery(WIDE_QUERY);

const valueColumns = computed(() =>
  boardColumns(props.sort).filter((column) => isWide.value || column.isActive),
);
const columns = computed<DataTableColumn[]>(() => [
  { key: 'rank', label: t('leaderboard.columns.rank'), align: 'end' },
  { key: 'user', label: t('leaderboard.columns.user'), priority: 'primary' },
  ...(isWide.value
    ? [
        {
          key: 'organization',
          label: t('leaderboard.columns.organization'),
          cellClass: 'max-w-32 truncate text-muted',
        },
      ]
    : []),
  ...valueColumns.value.map((column) => ({
    key: column.key,
    label: t(column.labelKey),
    align: 'end' as const,
    sort: { desc: column.key },
    cellClass: column.isActive ? 'font-bold text-positive' : undefined,
  })),
]);
const sortOptions = computed(() =>
  boardColumns(props.sort).map((column) => ({ value: column.key, label: t(column.labelKey) })),
);
const changeSort = (key: string | undefined) => {
  if (key) void router.push(sortLocation(key as LeaderboardSort));
};
const rowAttrs = (entry: LeaderboardEntry) => ({
  id: rowAnchor(entry.username),
  tabindex: '-1',
  class: entry.username === props.viewerName ? 'bg-accent-soft' : 'target:bg-accent-soft',
});
const valueOf = (entry: LeaderboardEntry, key: string) => {
  const value = entry[key as RankField];
  return value === null ? '—' : formatNumber(value, locale.locale);
};

/** A hash on the URL (find my rank) brings its row into view once the rows are there. */
const scrollToTarget = async () => {
  await nextTick();
  if (route.hash) revealRow(route.hash.slice(1));
};
watch(() => [props.entries, route.hash], scrollToTarget, { immediate: true });
</script>

<template>
  <DataTable
    :columns="columns"
    :rows="entries"
    :row-key="(entry) => entry.id"
    :row-attrs="rowAttrs"
    :label="$t('leaderboard.title')"
    stack="scroll"
    :sticky-columns="0"
    :skeleton-rows="12"
    :sort="sort"
    :loading="loading"
    :error="error"
    :pager="meta && { meta, label: $t('leaderboard.pagerLabel') }"
    @update:sort="changeSort"
    @retry="$emit('retry')"
  >
    <template v-if="!isWide" #toolbar>
      <ToolbarSelect
        :label="$t('leaderboard.sortBy')"
        :model-value="sort"
        :options="sortOptions"
        :active="false"
        @update:model-value="changeSort"
      />
    </template>
    <template #empty>
      <StatePanel kind="communityEmpty" :title="$t('leaderboard.empty')" />
    </template>
    <template #cell-rank="{ row }">
      <span class="flex items-center justify-end gap-1.5" :class="medalClass(row.rank)">
        <StateBit v-if="row.rank <= 3" variant="rankUp" size="tiny" />
        {{ formatNumber(row.rank, locale.locale) }}
      </span>
    </template>
    <template #cell-user="{ row }">
      <span class="flex items-center gap-2.5">
        <UserAvatar :username="row.username" :size="AVATAR_PX" class="shrink-0" />
        <span class="flex min-w-0 flex-col justify-center">
          <span class="flex items-center gap-2">
            <UserName
              :username="row.username"
              :rating="row.rating"
              :title="row.username"
              class="min-w-0 truncate"
            />
            <Chip v-if="row.username === viewerName" tone="accent">{{ $t('common.you') }}</Chip>
          </span>
          <span v-if="row.displayName !== row.username" class="truncate text-xs text-muted">
            {{ row.displayName }}
          </span>
        </span>
      </span>
    </template>
    <template #cell-organization="{ row }">{{ row.organization?.shortName ?? '—' }}</template>
    <template v-for="column in valueColumns" :key="column.key" #[`cell-${column.key}`]="{ row }">
      {{ valueOf(row, column.key) }}
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { UNCATEGORIZED_TYPE_NAME, problemTypeLabel } from './problem-type-label';
import { isProblemSort } from '@/api/types/problems';
import type { NumberedPageMeta } from '@/api/client';
import type { ProblemListItem, ProblemSort } from '@/api/types/problems';
import CompactListRow from '@/components/CompactListRow.vue';
import EmptyState from '@/components/EmptyState.vue';
import FactLine from '@/components/FactLine.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import DataTable from '@/components/ui/DataTable.vue';
import type { DataTableColumn } from '@/components/ui/DataTableColumns';
import { formatNumber } from '@/lib/format';
import { COMPACT_LIST_BELOW_PX } from '@/lib/use-media-query';
import { useLocaleStore } from '@/stores/locale.store';
import ProblemStatusMark from './ProblemStatusMark.vue';

/**
 * The problem list: the kit `DataTable` on a computer, one 32 px line per problem (48 px on a touch screen), and on a phone
 * compact rows instead of a table that scrolls sideways. Sorting is by the column headers; a third click on one returns to
 * the default order. An empty list under filters offers to clear them. Each table row carries `data-code` (the page loads
 * that problem ahead on hover and focus). The name takes the width the other columns leave.
 */
const props = defineProps<{
  problems: ProblemListItem[];
  sort: ProblemSort | null;
  /** Without a viewer there is no status to show, not even "not tried". */
  signedIn: boolean;
  loading: boolean;
  error: unknown;
  meta: NumberedPageMeta | undefined;
  /** The list is empty because of filters: the empty state offers to clear them. */
  filtered: boolean;
}>();
const emit = defineEmits<{ sort: [sort: ProblemSort | null]; retry: []; clearFilters: [] }>();
const { t } = useI18n();
const locale = useLocaleStore();
const target = (code: string) => ({ name: 'problem', params: { code } });

/** Numbers: highest first, then lowest first; the name: A to Z, then Z to A; then the default order. */
const sortOf = (field: string, first: 'asc' | 'desc') => ({
  asc: field,
  desc: `-${field}`,
  first,
  clears: true,
});
const columns = computed<DataTableColumn[]>(() => [
  ...(props.signedIn
    ? [{ key: 'status', label: t('problems.columns.status'), hideLabel: true }]
    : []),
  {
    key: 'code',
    label: t('problems.columns.code'),
    mono: true,
    sort: sortOf('code', 'asc'),
    cellClass: 'whitespace-nowrap text-meta text-secondary',
  },
  {
    key: 'name',
    label: t('problems.columns.problem'),
    priority: 'primary',
    sort: sortOf('name', 'asc'),
  },
  {
    key: 'points',
    label: t('problems.columns.points'),
    align: 'end',
    sort: sortOf('points', 'desc'),
  },
  {
    key: 'acRate',
    label: t('problems.columns.acRate'),
    align: 'end',
    sort: sortOf('acRate', 'desc'),
  },
  {
    key: 'userCount',
    label: t('problems.columns.users'),
    align: 'end',
    sort: sortOf('userCount', 'desc'),
  },
]);
const changeSort = (value: string | undefined) =>
  emit('sort', value !== undefined && isProblemSort(value) ? value : null);

/** The catch-all type says nothing in a list, so it is left out. */
function namedTypes(problem: ProblemListItem) {
  return problem.types
    .filter((type) => type.name !== UNCATEGORIZED_TYPE_NAME)
    .map((type) => problemTypeLabel(type));
}
/** One type chip, the rest counted in a "+N" that is never cut; all are named in the tooltip. The name keeps the width. */
const SHOWN_TYPES = 1;
const rowAttrs = (problem: ProblemListItem) => ({ 'data-code': problem.code });
const pointsText = (problem: ProblemListItem) =>
  t('problems.pointsValue', { points: formatNumber(problem.points, locale.locale, 2, false) });
</script>

<template>
  <!-- 32 px lines where the pointer is fine; a touch screen keeps the kit's 48 px rows, a finger's height. -->
  <DataTable
    class="[&_tbody_td]:h-(--qh-row) touch:[&_tbody_td]:h-12"
    :columns="columns"
    :rows="problems"
    :row-key="(problem) => problem.id"
    :label="$t('problems.listName')"
    :row-to="(problem) => target(problem.code)"
    :row-attrs="rowAttrs"
    :sort="sort ?? undefined"
    :loading="loading"
    :error="error"
    :stack-below="COMPACT_LIST_BELOW_PX"
    :pager="meta && { meta, label: $t('problems.pager') }"
    @update:sort="changeSort"
    @retry="emit('retry')"
  >
    <template #empty>
      <EmptyState>
        {{ $t('problems.empty') }}
        <template v-if="filtered" #action>
          <AppButton @click="emit('clearFilters')">{{ $t('common.clearFilters') }}</AppButton>
        </template>
      </EmptyState>
    </template>

    <template #cell-status="{ row }"><ProblemStatusMark :status="row.viewerStatus" /></template>
    <!-- The code is never cut: it is what tells `_r1_a` from `_r2_a`. The name keeps the rest of the width. -->
    <template #cell-code="{ row }">{{ row.code }}</template>
    <!-- The type is a small chip after the name, only when the problem has one; the name is cut before it. -->
    <template #cell-name="{ row }">
      <span class="flex items-center gap-2">
        <RouterLink
          :to="target(row.code)"
          :title="row.name"
          class="min-w-0 truncate font-medium text-content hover:text-accent-text"
          >{{ row.name }}</RouterLink
        >
        <span
          v-if="namedTypes(row).length > 0"
          class="flex shrink-0 items-center gap-1"
          :title="namedTypes(row).join(', ')"
        >
          <Chip size="sm"
            ><span class="block max-w-40 truncate">{{ namedTypes(row)[0] }}</span></Chip
          >
          <span
            v-if="namedTypes(row).length > SHOWN_TYPES"
            class="text-caption whitespace-nowrap text-muted"
            >+{{ namedTypes(row).length - SHOWN_TYPES }}</span
          >
        </span>
      </span>
    </template>
    <template #cell-points="{ row }">
      <span class="font-medium" :title="row.partial ? $t('problems.partialHint') : undefined">{{
        pointsText(row)
      }}</span>
    </template>
    <template #cell-acRate="{ row }">{{ formatNumber(row.acRate, locale.locale, 1) }}%</template>
    <template #cell-userCount="{ row }">{{ formatNumber(row.userCount, locale.locale) }}</template>

    <!-- Below `sm` a row is a compact list row. -->
    <template #card="{ row }">
      <CompactListRow :to="target(row.code)" :title="row.name">
        <template v-if="signedIn" #lead><ProblemStatusMark :status="row.viewerStatus" /></template>
        <template #meta>
          <FactLine
            class="font-mono"
            :facts="[row.code, `AC ${formatNumber(row.acRate, locale.locale, 1)}%`]"
          />
        </template>
        <template #trail>
          <span class="font-mono text-sm font-medium tabular-nums">{{ pointsText(row) }}</span>
          <span class="text-caption text-muted tabular-nums">{{
            $t('problems.solverCount', { count: formatNumber(row.userCount, locale.locale) })
          }}</span>
        </template>
      </CompactListRow>
    </template>
  </DataTable>
</template>

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
import DataTable from '@/components/ui/DataTable.vue';
import type { DataTableColumn } from '@/components/ui/DataTableColumns';
import { formatNumber, formatProblemPoints } from '@/lib/format';
import { COMPACT_LIST_BELOW_PX } from '@/lib/use-media-query';
import { useLocaleStore } from '@/stores/locale.store';
import ProblemStatusMark from './ProblemStatusMark.vue';
import ProblemTierMark from './ProblemTierMark.vue';

/**
 * The problem list: the kit `DataTable` (48 px rows) on a computer, and on a phone compact rows instead of a table
 * that scrolls sideways. Sorting is by the column headers; a third click on one returns to the default order. An empty list
 * under filters offers to clear them.
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
    key: 'name',
    label: t('problems.columns.problem'),
    priority: 'primary',
    sort: sortOf('name', 'asc'),
  },
  {
    key: 'types',
    label: t('problems.columns.types'),
    hideBelow: 'lg',
    cellClass: 'w-64 max-w-64 truncate text-caption text-muted',
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
const namedTypes = (problem: ProblemListItem) =>
  problem.types
    .filter((type) => type.name !== UNCATEGORIZED_TYPE_NAME)
    .map((type) => problemTypeLabel(type))
    .join(', ');
/** The types column: a problem with no other type shows a dash. */
const typesText = (problem: ProblemListItem) => namedTypes(problem) || '—';
const pointsText = (problem: ProblemListItem) =>
  formatProblemPoints(problem.points, problem.partial, locale.locale);
</script>

<template>
  <DataTable
    :columns="columns"
    :rows="problems"
    :row-key="(problem) => problem.id"
    :label="$t('problems.listName')"
    :row-to="(problem) => target(problem.code)"
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
          <AppButton @click="emit('clearFilters')">{{ $t('problems.clearFilters') }}</AppButton>
        </template>
      </EmptyState>
    </template>

    <template #cell-status="{ row }"><ProblemStatusMark :status="row.viewerStatus" /></template>
    <template #cell-name="{ row }">
      <RouterLink
        :to="target(row.code)"
        class="block truncate font-medium text-content hover:text-accent-text"
        >{{ row.name }}</RouterLink
      >
      <span class="block truncate text-caption text-muted">
        <span class="font-mono">{{ row.code }}</span>
        <!-- Below `lg` the types column is hidden, so the name does not truncate: its types go on this line. -->
        <span v-if="namedTypes(row)" class="lg:hidden"> · {{ namedTypes(row) }}</span>
      </span>
    </template>
    <template #cell-types="{ row }">{{ typesText(row) }}</template>
    <template #cell-points="{ row }">
      <span class="inline-flex items-center gap-[7px] font-medium">
        <ProblemTierMark :points="row.points" />
        {{ pointsText(row) }}
      </span>
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
          <span
            class="inline-flex items-center gap-[7px] font-mono text-sm font-medium tabular-nums"
          >
            <ProblemTierMark :points="row.points" />
            {{ pointsText(row) }}
          </span>
          <span class="text-caption text-muted tabular-nums">{{
            $t('problems.solverCount', { count: formatNumber(row.userCount, locale.locale) })
          }}</span>
        </template>
      </CompactListRow>
    </template>
  </DataTable>
</template>

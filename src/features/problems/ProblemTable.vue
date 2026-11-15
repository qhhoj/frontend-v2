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
import { formatNumber, formatProblemPoints } from '@/lib/format';
import { COMPACT_LIST_BELOW_PX } from '@/lib/use-media-query';
import { useLocaleStore } from '@/stores/locale.store';
import ProblemStatusMark from './ProblemStatusMark.vue';
import ProblemTierMark from './ProblemTierMark.vue';

/**
 * The problem list: the kit `DataTable` on a computer, one 32 px line per problem (48 px on a touch screen), and on a phone
 * compact rows instead of a table that scrolls sideways. Sorting is by the column headers; a third click on one returns to
 * the default order. An empty list under filters offers to clear them. Each table row carries `data-code`, and the row in
 * the peek pane (`peekCode`) is marked.
 */
const props = withDefaults(
  defineProps<{
    problems: ProblemListItem[];
    sort: ProblemSort | null;
    /** Without a viewer there is no status to show, not even "not tried". */
    signedIn: boolean;
    loading: boolean;
    error: unknown;
    meta: NumberedPageMeta | undefined;
    /** The list is empty because of filters: the empty state offers to clear them. */
    filtered: boolean;
    /** The problem the peek pane shows. */
    peekCode?: string | null;
    /** The types column, when a problem on the page has types (the peek pane beside a narrow table names them instead). */
    typesColumn?: boolean;
  }>(),
  { peekCode: null, typesColumn: true },
);
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
/** The types column only when wanted and a problem on this page has a type worth naming. */
const hasTypes = computed(
  () => props.typesColumn && props.problems.some((problem) => namedTypes(problem).length > 0),
);
const columns = computed<DataTableColumn[]>(() => [
  ...(props.signedIn
    ? [{ key: 'status', label: t('problems.columns.status'), hideLabel: true }]
    : []),
  {
    key: 'code',
    label: t('problems.columns.code'),
    mono: true,
    sort: sortOf('code', 'asc'),
    cellClass: 'text-meta text-secondary',
  },
  {
    key: 'name',
    label: t('problems.columns.problem'),
    priority: 'primary',
    sort: sortOf('name', 'asc'),
  },
  ...(hasTypes.value
    ? [
        {
          key: 'types',
          label: t('problems.columns.types'),
          hideBelow: 'lg' as const,
          cellClass: 'w-56 max-w-56',
        },
      ]
    : []),
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
/** Two type chips fit the column; the rest are counted, and all are named in the tooltip. */
const SHOWN_TYPES = 2;
const rowAttrs = (problem: ProblemListItem) => ({
  'data-code': problem.code,
  class: problem.code === props.peekCode ? 'bg-accent-soft hover:bg-accent-soft' : undefined,
});
const pointsText = (problem: ProblemListItem) =>
  formatProblemPoints(problem.points, problem.partial, locale.locale);
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
    <template #cell-name="{ row }">
      <RouterLink
        :to="target(row.code)"
        :title="row.name"
        class="block truncate font-medium text-content hover:text-accent-text"
        >{{ row.name }}</RouterLink
      >
    </template>
    <template #cell-types="{ row }">
      <span class="flex items-center gap-1 overflow-hidden" :title="namedTypes(row).join(', ')">
        <Chip v-for="name in namedTypes(row).slice(0, SHOWN_TYPES)" :key="name" size="sm">{{
          name
        }}</Chip>
        <span
          v-if="namedTypes(row).length > SHOWN_TYPES"
          class="text-caption whitespace-nowrap text-muted"
          >+{{ namedTypes(row).length - SHOWN_TYPES }}</span
        >
      </span>
    </template>
    <template #cell-points="{ row }">
      <span
        class="inline-flex items-center gap-2 font-medium"
        :title="row.partial ? $t('problems.partialHint') : undefined"
      >
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
          <span class="inline-flex items-center gap-2 font-mono text-sm font-medium tabular-nums">
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

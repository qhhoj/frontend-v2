<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { UNCATEGORIZED_TYPE_NAME, problemTypeLabel } from './problem-type-label';
import { isProblemSort } from '@/api/types/problems';
import type { NumberedPageMeta } from '@/api/client';
import type { ProblemListItem, ProblemSort } from '@/api/types/problems';
import CompactListRow from '@/components/CompactListRow.vue';
import EmptyState from '@/components/EmptyState.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import DataTable from '@/components/ui/DataTable.vue';
import type { DataTableColumn } from '@/components/ui/DataTableColumns';
import { CUE_ROW, CUE_TABLE_ROW } from '@/components/ui/cue-tones';
import type { CueTone } from '@/components/ui/cue-tones';
import { acRateTextClass } from '@/lib/ac-rate';
import { formatNumber, formatPoints } from '@/lib/format';
import { COMPACT_LIST_BELOW_PX } from '@/lib/use-media-query';
import { useLocaleStore } from '@/stores/locale.store';
import ProblemStatusMark from './ProblemStatusMark.vue';

/**
 * The problem list: the kit `DataTable` as a frameless ledger (`variant="ledger"`) on a computer, one `--qh-row` line per
 * problem (the touch height on a touch screen), and on a phone compact rows instead of a table that scrolls sideways. One "Bài" column holds the name and, after it, the code in grey mono;
 * points, acceptance and solvers are narrow fixed columns at the right, plain numbers under their headers (no unit in a row).
 * The acceptance number takes its colour from `acRateTextClass` (low = hard), on the table and the phone rows alike. Sorting is by the column headers (only the sorted one shows its arrow, the others show
 * it on hover); a third click on one returns to the default order. An empty list under filters offers to clear them. Each table row carries `data-code` (the page loads
 * that problem ahead on hover and focus).
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
    key: 'points',
    label: t('problems.columns.points'),
    align: 'end',
    cellClass: 'w-20',
    sort: sortOf('points', 'desc'),
  },
  {
    key: 'acRate',
    label: t('problems.columns.acRate'),
    align: 'end',
    cellClass: 'w-16',
    sort: sortOf('acRate', 'desc'),
  },
  {
    key: 'userCount',
    label: t('problems.columns.users'),
    align: 'end',
    cellClass: 'w-24',
    sort: sortOf('userCount', 'desc'),
  },
]);
/** Ledger tweaks the kit has no prop for: unsorted headers show their arrow on hover only; phone rows and the cells at the row ends keep a small inset so a tinted row does not touch its content. */
const LEDGER_CLASS =
  '[&_thead_th:not([aria-sort])_svg]:invisible [&_thead_th:not([aria-sort])_button:hover_svg]:visible [&_li]:px-2 [&_li:last-child]:border-b [&_:is(th,td):first-child]:pl-2 [&_:is(th,td):last-child]:pr-2';
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
/** Only a solved problem tints its row; tried and not tried show no tint (the status icon says it). */
const rowTone = (problem: ProblemListItem): CueTone | null =>
  props.signedIn && problem.viewerStatus === 'solved' ? 'full' : null;
const phoneRowClass = (problem: ProblemListItem) => {
  const tone = rowTone(problem);
  return tone ? CUE_ROW[tone] : undefined;
};
const rowAttrs = (problem: ProblemListItem) => {
  const tone = rowTone(problem);
  return { 'data-code': problem.code, class: tone ? CUE_TABLE_ROW[tone] : undefined };
};
const pointsText = (problem: ProblemListItem) => formatPoints(problem.points, locale.locale);
const acRateText = (problem: ProblemListItem) =>
  `${formatNumber(problem.acRate, locale.locale, 1)}%`;
</script>

<template>
  <DataTable
    variant="ledger"
    :class="LEDGER_CLASS"
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
      <EmptyState inline>
        {{ $t('problems.empty') }}
        <template v-if="filtered" #action>
          <AppButton @click="emit('clearFilters')">{{ $t('common.clearFilters') }}</AppButton>
        </template>
      </EmptyState>
    </template>

    <template #cell-status="{ row }"><ProblemStatusMark :status="row.viewerStatus" /></template>
    <!-- Name, then the code in grey mono on the same line (under the name when the line is full), then the type chip. -->
    <template #cell-name="{ row }">
      <span class="flex flex-wrap items-baseline gap-x-2">
        <RouterLink
          :to="target(row.code)"
          :title="row.name"
          class="min-w-0 font-semibold text-content hover:text-accent-text"
          >{{ row.name }}</RouterLink
        >
        <span class="font-mono text-caption text-muted">{{ row.code }}</span>
        <span
          v-if="namedTypes(row).length > 0"
          class="flex shrink-0 items-center gap-1 self-center"
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
      <span :title="row.partial ? $t('problems.partialHint') : undefined">{{
        pointsText(row)
      }}</span>
    </template>
    <template #cell-acRate="{ row }">
      <span class="font-semibold" :class="acRateTextClass(row.acRate)">{{ acRateText(row) }}</span>
    </template>
    <template #cell-userCount="{ row }">{{ formatNumber(row.userCount, locale.locale) }}</template>

    <!-- Below `sm` a row is a compact list row. -->
    <template #card="{ row }">
      <CompactListRow :to="target(row.code)" :title="row.name" :class="phoneRowClass(row)">
        <template v-if="signedIn" #lead><ProblemStatusMark :status="row.viewerStatus" /></template>
        <template #meta>
          <span class="font-mono">{{ row.code }}</span>
          ·
          <span class="font-semibold whitespace-nowrap" :class="acRateTextClass(row.acRate)"
            >AC {{ acRateText(row) }}</span
          >
        </template>
        <!-- Points: a plain number, no unit (as on the home's new problems). -->
        <template #trail>
          <span class="font-mono text-sm font-medium tabular-nums">{{ pointsText(row) }}</span>
        </template>
      </CompactListRow>
    </template>
  </DataTable>
</template>

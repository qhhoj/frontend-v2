<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { UNCATEGORIZED_TYPE_NAME, problemTypeLabel } from './problem-type-label';
import { isProblemSort } from '@/api/types/problems';
import type { NumberedPageMeta } from '@/api/client';
import type { ProblemListItem, ProblemSort } from '@/api/types/problems';
import EmptyState from '@/components/EmptyState.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import DataTable from '@/components/ui/DataTable.vue';
import type { DataTableColumn } from '@/components/ui/DataTableColumns';
import Lamp from '@/components/ui/Lamp.vue';
import StretchedLink from '@/components/ui/StretchedLink.vue';
import { formatNumber, formatPoints } from '@/lib/format';
import { COMPACT_LIST_BELOW_PX } from '@/lib/use-media-query';
import { useLocaleStore } from '@/stores/locale.store';
import RateBar from './RateBar.vue';
import { splitProblemName } from './problem-name';
import { viewerLampOf } from './viewer-status';

/**
 * The problem list (redesign "Sơn mài"): the kit `DataTable` as a frameless ledger, one `--qh-row` line per problem. The first
 * column is the viewer's own status as a lamp (signed in only); then the name (the prefix problems of one contest share is
 * dimmed, the part after the last " - " is bold), its code in grey mono and its type tag; at the right points, the acceptance
 * rate as one neutral bar and a number, and solvers. No row tint and no colour scale: colour is the viewer's result only.
 * Sorting is by the column headers (only the sorted one shows its arrow, the others on hover); a third click returns to the
 * default order. On a phone a row is two lines (`--qh-row-phone`): the name over its code, the points at the right. Each
 * table row carries `data-code` (the page loads that problem ahead on hover and focus).
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
    ? [{ key: 'status', label: t('problems.columns.status'), hideLabel: true, cellClass: 'w-8' }]
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
    label: t('problem.strip.acRate'),
    align: 'end',
    cellClass: 'w-36',
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
/** Ledger tweaks the kit has no prop for: unsorted headers show their arrow on hover only; the cells at the row ends keep a small inset so the hover ground does not touch its content. */
const LEDGER_CLASS =
  '[&_thead_th:not([aria-sort])_svg]:invisible [&_thead_th:not([aria-sort])_button:hover_svg]:visible [&_:is(th,td):first-child]:pl-2 [&_:is(th,td):last-child]:pr-2';
const changeSort = (value: string | undefined) =>
  emit('sort', value !== undefined && isProblemSort(value) ? value : null);

/** The catch-all type says nothing in a list, so it is left out. */
function namedTypes(problem: ProblemListItem) {
  return problem.types
    .filter((type) => type.name !== UNCATEGORIZED_TYPE_NAME)
    .map((type) => problemTypeLabel(type));
}
/** One type tag, the rest counted in a "+N" that is never cut; all are named in the tooltip. The name keeps the width. */
const SHOWN_TYPES = 1;
const rowAttrs = (problem: ProblemListItem) => ({ 'data-code': problem.code });
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

    <template #cell-status="{ row }">
      <Lamp
        :tone="viewerLampOf(row.viewerStatus).tone"
        :label="$t(viewerLampOf(row.viewerStatus).labelKey)"
      />
    </template>
    <!-- The name on one line (cut with an ellipsis, whole in the tooltip), then the code in grey mono and the type tag. -->
    <template #cell-name="{ row }">
      <span class="flex min-w-0 items-baseline gap-x-2">
        <RouterLink
          :to="target(row.code)"
          :title="row.name"
          class="min-w-0 truncate text-content hover:text-accent-text"
          ><span v-if="splitProblemName(row.name).shared" class="text-muted">{{
            splitProblemName(row.name).shared
          }}</span
          ><span class="font-semibold">{{ splitProblemName(row.name).own }}</span></RouterLink
        >
        <span class="shrink-0 font-mono text-small text-muted">{{ row.code }}</span>
        <span
          v-if="namedTypes(row).length > 0"
          class="flex shrink-0 items-center gap-1 self-center max-lg:hidden"
          :title="namedTypes(row).join(', ')"
        >
          <Chip size="sm"
            ><span class="block max-w-40 truncate">{{ namedTypes(row)[0] }}</span></Chip
          >
          <span
            v-if="namedTypes(row).length > SHOWN_TYPES"
            class="text-small whitespace-nowrap text-muted"
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
      <span class="inline-flex items-center gap-2">
        <RateBar :percent="row.acRate" />
        <span class="inline-block w-14">{{ acRateText(row) }}</span>
      </span>
    </template>
    <template #cell-userCount="{ row }">{{ formatNumber(row.userCount, locale.locale) }}</template>

    <!-- A phone: two lines per row. The part of the name the contest shares is left out; the code under it says it. -->
    <template #card="{ row }">
      <li
        class="box-link flex min-h-(--qh-row-phone) items-center gap-3 border-b border-line px-2 py-1"
      >
        <Lamp
          v-if="signedIn"
          :tone="viewerLampOf(row.viewerStatus).tone"
          :label="$t(viewerLampOf(row.viewerStatus).labelKey)"
          class="shrink-0"
        />
        <span class="flex min-w-0 flex-1 flex-col">
          <StretchedLink
            :to="target(row.code)"
            :title="row.name"
            class="line-clamp-2 text-body font-semibold text-content"
            >{{ splitProblemName(row.name).own }}</StretchedLink
          >
          <span class="truncate font-mono text-small text-muted">{{ row.code }}</span>
        </span>
        <span
          class="shrink-0 font-mono text-body tabular-nums"
          :title="row.partial ? $t('problems.partialHint') : undefined"
          >{{ pointsText(row) }}</span
        >
      </li>
    </template>
  </DataTable>
</template>

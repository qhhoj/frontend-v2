<script setup lang="ts" generic="Row">
import { ArrowDown, ArrowUp, ChevronDown, ChevronsUpDown } from 'lucide-vue-next';
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import type { NumberedPageMeta } from '@/api/client';
import EmptyState from '@/components/EmptyState.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import PageOutOfRange from '@/components/PageOutOfRange.vue';
import { fallbackPageOf } from '@/lib/paging';
import QueryState from '@/components/QueryState.vue';
import ScrollRegion from '@/components/ScrollRegion.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useMediaQuery } from '@/lib/use-media-query';
import AppButton from './AppButton.vue';
import { CARD_VARIANTS } from './Card.variants';
import { useRowOpen } from './use-row-open';
import AdminBulkBar from '@/features/admin/ui/table/AdminBulkBar.vue';
import DataTableCheckbox from './DataTableCheckbox.vue';
import { ariaSortOf, hiddenClass, nextSort, rangeOf, stickyOffsets } from './DataTableColumns';
import type { DataTableColumn } from './DataTableColumns';

/**
 * The list table: a card with an optional toolbar, sortable headers, optional row selection with the bulk bar in place of
 * the toolbar, row actions at the end, loading (a skeleton shaped from the columns, header row included), error, empty and
 * filtered-empty states, and a footer (the `pager` range and NumberedPager, or the `footer` slot).
 *
 * `stack="card"`: below `stackBelow` px each row is a card instead (see `DataTableColumns.ts`, or the `card` slot for a
 * row of your own: an `<li>`); only one of the two is rendered, so row hooks such as `data-code` (`rowAttrs`) exist once.
 * `stack="scroll"`: always the table, scrolling sideways inside its card with the first `stickyColumns` columns pinned and a
 * shade beside them once scrolled.
 * `density="compact"` is the admin look (40 px rows, flat card, small pager); `comfortable` the public one (48 px rows, the
 * page card, the regular pager). A row is at least that tall: cells carry no vertical padding, so a two-line cell (a name
 * over its code) fits the 48 px. Both draw the header the same way: `text-meta text-muted`, sentence case.
 * `rowTo` makes a row open a page on click (Ctrl/Cmd or middle click: a new tab; never at the end of a text selection);
 * the primary cell is the link, so keyboard and screen readers use that.
 *
 * Slots: `toolbar`, `bulk` (actions while rows are selected), `cell-<key>` ({ row }), `actions` ({ row }), `card` ({ row },
 * a stacked row), `empty`, `footer`.
 * Models: `sort` (the `?sort=` value), `selected` (row keys). `selectable` adds the checkbox column.
 */
const props = withDefaults(
  defineProps<{
    columns: DataTableColumn[];
    rows: readonly Row[];
    rowKey: (row: Row) => string;
    /** The table's caption, for screen readers. */
    label: string;
    rowLabel?: (row: Row) => string;
    rowAttrs?: (row: Row) => Record<string, string | undefined>;
    rowTo?: (row: Row) => RouteLocationRaw;
    selectable?: boolean;
    loading?: boolean;
    error?: unknown;
    skeletonRows?: number;
    /** The list is empty because of a filter: offer "Xóa bộ lọc" (emits `clear-filters`). */
    filtered?: boolean;
    emptyText?: string;
    /** Caps the card's height so the header sticks while the rows scroll (a CSS length). */
    maxHeight?: string;
    density?: 'compact' | 'comfortable';
    stack?: 'card' | 'scroll';
    /** `stack="card"`: the viewport width (px) below which rows become cards. */
    stackBelow?: number;
    /** `stack="scroll"`: how many leading columns stay pinned while the rest scroll. */
    stickyColumns?: number;
    /** A numbered page: the footer shows its "1–50 / 312" range and the page links. */
    pager?: { meta: NumberedPageMeta; label: string; queryKey?: string };
  }>(),
  {
    rowLabel: undefined,
    rowAttrs: undefined,
    rowTo: undefined,
    selectable: false,
    loading: false,
    error: undefined,
    skeletonRows: 8,
    filtered: false,
    emptyText: undefined,
    maxHeight: undefined,
    density: 'comfortable',
    stack: 'card',
    stackBelow: 640,
    stickyColumns: 1,
    pager: undefined,
  },
);
const sort = defineModel<string | undefined>('sort');
const selected = defineModel<Set<string>>('selected', { default: () => new Set<string>() });
defineEmits<{ retry: []; 'clear-filters': [] }>();
defineSlots<
  {
    toolbar?: () => unknown;
    bulk?: (scope: { count: number }) => unknown;
    actions?: (scope: { row: Row }) => unknown;
    card?: (scope: { row: Row }) => unknown;
    empty?: () => unknown;
    footer?: () => unknown;
  } & Record<`cell-${string}`, (scope: { row: Row }) => unknown>
>();

const isNarrow = useMediaQuery(`(max-width: ${props.stackBelow - 0.02}px)`);
const isCards = computed(() => props.stack === 'card' && isNarrow.value);
const isCompact = computed(() => props.density === 'compact');
const labelOf = (row: Row) => props.rowLabel?.(row) ?? props.rowKey(row);
const byPriority = (priority: DataTableColumn['priority']) =>
  props.columns.filter((column) => (column.priority ?? 'secondary') === priority);
const primary = computed(() => byPriority('primary')[0] ?? props.columns[0]);
const badges = computed(() => byPriority('badge'));
const secondary = computed(() =>
  byPriority('secondary').filter((column) => column !== primary.value),
);
const meta = computed(() => byPriority('meta'));

const shownKeys = computed(() => props.rows.map((row) => props.rowKey(row)));
const pickedOnPage = computed(() => shownKeys.value.filter((key) => selected.value.has(key)));
const isAllPicked = computed(
  () => shownKeys.value.length > 0 && pickedOnPage.value.length === shownKeys.value.length,
);
const isSomePicked = computed(() => pickedOnPage.value.length > 0 && !isAllPicked.value);
function toggleAll() {
  selected.value = isAllPicked.value ? new Set() : new Set(shownKeys.value);
}
function toggleRow(row: Row, isOn: boolean) {
  const next = new Set(selected.value);
  if (isOn) next.add(props.rowKey(row));
  else next.delete(props.rowKey(row));
  selected.value = next;
}
const clearSelection = () => (selected.value = new Set());

/** Card rows whose "Chi tiết" (the `meta` columns) is open, by row key. */
const openDetails = ref(new Set<string>());
const detailsId = useId();
function toggleDetails(key: string) {
  const next = new Set(openDetails.value);
  if (!next.delete(key)) next.add(key);
  openDetails.value = next;
}

/** The default cell: a string or number field of the row; anything else needs a `cell-<key>` slot. */
const cellText = (row: Row, key: string) => {
  const value = (row as Record<string, unknown>)[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) || '—' : '—';
};
/**
 * Numbers and `mono` values stay on one line, so their column is as wide as the value. A text column may break anywhere
 * (`overflow-wrap: anywhere`, so one long username cannot widen the table past its card), but that also lowers its
 * min-content width to one letter and the growing column would squeeze it to a letter per line: it keeps 5rem at least
 * (badges are chips that never break, icon columns are as wide as their icon, the growing one yields on purpose).
 * `:where()` keeps the floor at zero specificity for a column's own `cellClass`.
 */
const alignClass = (column: DataTableColumn) => {
  if (column.align === 'end') return 'text-right font-mono tabular-nums whitespace-nowrap';
  if (column.mono) return 'text-left font-mono whitespace-nowrap';
  const hasFloor = !column.hideLabel && column.priority !== 'badge' && !growsOf(column);
  return hasFloor ? 'text-left [:where(&)]:min-w-20' : 'text-left';
};
/**
 * `max-w-0` + `w-full` is the auto-layout idiom for "all the leftover width, never more": the content wraps or truncates
 * inside it. The column marked `grow` gets it, else the primary one: the name is what yields when the others need room.
 */
const growsOf = (column: DataTableColumn) =>
  column.grow ?? (!props.columns.some((other) => other.grow) && column === primary.value);
const growClass = (column: DataTableColumn) => growsOf(column) && 'w-full max-w-0';
const CELL_BASE =
  'border-b border-line px-3 align-middle [overflow-wrap:anywhere] [:where(&)]:max-w-64';
/** A body cell is the row's minimum height (admin 40 px, public 48 px); a header cell is as tall as an admin row, or 40 px. */
const CELL = computed(() => `${isCompact.value ? 'h-(--qa-row)' : 'h-12'} ${CELL_BASE}`);
const HEAD_CELL = computed(() => `${isCompact.value ? 'h-(--qa-row)' : 'h-10'} ${CELL_BASE}`);
const HEAD_TEXT = 'text-meta font-semibold whitespace-nowrap text-muted';
const SORT_BUTTON =
  'inline-flex min-h-6 items-center gap-1 rounded-cell hover:text-content touch:min-h-11';
const FRAME = computed(() => CARD_VARIANTS[isCompact.value ? 'flat' : 'glass']);
const frameStyle = computed(() => (props.maxHeight ? { maxHeight: props.maxHeight } : undefined));

const range = computed(() => {
  const pageMeta = props.pager?.meta;
  if (!pageMeta || !('total' in pageMeta)) return null;
  return rangeOf(pageMeta.page, pageMeta.pageSize, props.rows.length, pageMeta.total);
});
/** An empty page although earlier ones exist (an old or edited `?page=`): the empty text must not claim the list is empty. */
const isPastLastPage = computed(
  () => !!props.pager && fallbackPageOf(props.pager.meta, props.rows.length) !== null,
);
const hasFooter = computed(() => !props.loading && props.rows.length > 0);

/** The skeleton's stand-in width for one cell: short for numbers and icon columns, long for the growing one. */
const skeletonWidth = (column: DataTableColumn) => {
  if (column.hideLabel) return 'w-6';
  if (column.align === 'end') return 'w-10';
  return growsOf(column) ? 'w-3/4' : 'w-16';
};

const { open: openTarget, openInTab } = useRowOpen();
/** A click anywhere on a `rowTo` row opens it, except on its own links and controls. */
const openRow = (row: Row, event: MouseEvent) => props.rowTo && openTarget(event, props.rowTo(row));
const openRowInTab = (row: Row, event: MouseEvent) =>
  props.rowTo && openInTab(event, props.rowTo(row));

/** Pinned columns (`stack="scroll"`): the checkbox column, if any, plus the first `stickyColumns` ones. */
const pinnedCount = computed(() =>
  props.stack === 'scroll' ? props.stickyColumns + (props.selectable ? 1 : 0) : 0,
);
const headRow = ref<HTMLTableRowElement | null>(null);
const pinnedLefts = ref<number[]>([]);
const isScrolledSideways = ref(false);
function measurePinned() {
  const cells = Array.from(headRow.value?.cells ?? []).slice(0, pinnedCount.value);
  pinnedLefts.value = stickyOffsets(cells.map((cell) => cell.offsetWidth));
}
const onScroll = (event: Event) =>
  (isScrolledSideways.value = (event.target as HTMLElement).scrollLeft > 1);
let observer: ResizeObserver | undefined;
function observePinned() {
  observer?.disconnect();
  measurePinned();
  if (!pinnedCount.value || !headRow.value || typeof ResizeObserver === 'undefined') return;
  observer = new ResizeObserver(measurePinned);
  observer.observe(headRow.value);
}
onMounted(observePinned);
watch(headRow, observePinned, { flush: 'post' });
onBeforeUnmount(() => observer?.disconnect());

const SHADE =
  'after:pointer-events-none after:absolute after:inset-y-0 after:left-full after:w-6 after:bg-linear-to-r after:from-content/15 after:to-transparent';
/** Header cells stick to the top; pinned ones (`stack="scroll"`) also to the left, above the rest. */
const headPin = (index: number) => {
  const pin = pinOf(index);
  return {
    class: ['sticky top-0 bg-surface-solid', pin ? ['z-20', pin.class] : 'z-10'],
    style: pin?.style,
  };
};
/** Classes and `left` of the cell at `index` (counting the checkbox column) when it is pinned. */
function pinOf(index: number) {
  if (index >= pinnedCount.value) return undefined;
  const isEdge = index === pinnedCount.value - 1 && isScrolledSideways.value;
  return {
    class: ['sticky bg-surface-solid', isEdge && SHADE],
    style: { left: `${pinnedLefts.value[index] ?? 0}px` },
  };
}
const bodyPin = (index: number) => {
  const pin = pinOf(index);
  return pin && { class: ['z-1', pin.class], style: pin.style };
};
const offset = computed(() => (props.selectable ? 1 : 0));
</script>

<template>
  <div :class="[FRAME, 'flex min-w-0 flex-col overflow-hidden']">
    <AdminBulkBar
      v-if="selectable && selected.size > 0"
      :count="selected.size"
      @clear="clearSelection"
    >
      <slot name="bulk" :count="selected.size" />
    </AdminBulkBar>
    <div
      v-else-if="$slots.toolbar"
      class="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2"
    >
      <slot name="toolbar" />
    </div>

    <QueryState :loading="loading" :error="error" @retry="$emit('retry')">
      <template #skeleton>
        <ul v-if="isCards" class="m-0 flex list-none flex-col p-0">
          <li
            v-for="index in skeletonRows"
            :key="index"
            class="flex flex-col gap-1.5 border-b border-line px-4 py-3 text-sm last:border-b-0"
          >
            <span><SkeletonBlock text class="w-48" /></span>
            <span v-if="secondary.length"><SkeletonBlock text class="w-32" /></span>
          </li>
        </ul>
        <table v-else class="w-full border-collapse text-sm [&_tr:last-child_td]:border-b-0">
          <thead>
            <tr>
              <th v-if="selectable" scope="col" :class="[HEAD_CELL, 'w-10']" />
              <th
                v-for="column in columns"
                :key="column.key"
                scope="col"
                :class="[
                  HEAD_CELL,
                  HEAD_TEXT,
                  alignClass(column),
                  growClass(column),
                  hiddenClass(column),
                ]"
              >
                <SkeletonBlock v-if="!column.hideLabel" text class="w-12 max-w-full" />
              </th>
              <th v-if="$slots.actions" scope="col" :class="[HEAD_CELL, 'w-px']" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="index in skeletonRows" :key="index">
              <td v-if="selectable" :class="[CELL, 'w-10']"><SkeletonBlock class="size-4" /></td>
              <td
                v-for="column in columns"
                :key="column.key"
                :class="[CELL, alignClass(column), growClass(column), hiddenClass(column)]"
              >
                <SkeletonBlock text :class="skeletonWidth(column)" />
              </td>
              <td v-if="$slots.actions" :class="[CELL, 'w-px']">
                <SkeletonBlock text class="w-6" />
              </td>
            </tr>
          </tbody>
        </table>
      </template>

      <template v-if="rows.length === 0">
        <PageOutOfRange
          v-if="pager && isPastLastPage"
          :meta="pager.meta"
          :row-count="rows.length"
          :query-key="pager.queryKey"
        />
        <slot v-else name="empty">
          <div v-if="filtered" class="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <p class="text-muted">{{ $t('common.table.emptyFiltered') }}</p>
            <AppButton size="sm" @click="$emit('clear-filters')">
              {{ $t('common.clearFilters') }}
            </AppButton>
          </div>
          <EmptyState v-else>{{ emptyText ?? $t('common.table.empty') }}</EmptyState>
        </slot>
      </template>

      <!-- Narrow screens: one card per row, the page's own (`card` slot) or the built-in one. -->
      <ul v-else-if="isCards && $slots.card" class="m-0 list-none p-0" :aria-label="label">
        <template v-for="row in rows" :key="rowKey(row)"><slot name="card" :row="row" /></template>
      </ul>
      <ul v-else-if="isCards" class="m-0 flex list-none flex-col p-0" :aria-label="label">
        <li
          v-for="(row, index) in rows"
          :key="rowKey(row)"
          v-bind="rowAttrs?.(row)"
          class="flex flex-col gap-1.5 border-b border-line px-4 py-3 last:border-b-0"
          :class="[selected.has(rowKey(row)) && 'bg-accent-soft', rowTo && 'cursor-pointer']"
          @click="openRow(row, $event)"
          @auxclick="openRowInTab(row, $event)"
        >
          <div class="flex min-w-0 items-start gap-3">
            <span v-if="selectable" class="mt-1 flex shrink-0">
              <DataTableCheckbox
                :checked="selected.has(rowKey(row))"
                :label="$t('common.table.selectRow', { name: labelOf(row) })"
                @change="toggleRow(row, $event)"
              />
            </span>
            <div class="flex min-w-0 flex-1 flex-wrap items-start gap-x-3 gap-y-1">
              <div class="min-w-0 flex-1 basis-28">
                <slot :name="`cell-${primary!.key}`" :row="row">
                  <RouterLink v-if="rowTo" :to="rowTo(row)" class="font-semibold hover:underline">
                    {{ cellText(row, primary!.key) }}
                  </RouterLink>
                  <template v-else>{{ cellText(row, primary!.key) }}</template>
                </slot>
              </div>
              <div
                v-if="badges.length"
                class="flex max-w-full shrink-0 flex-wrap justify-end gap-1"
              >
                <template v-for="column in badges" :key="column.key">
                  <slot :name="`cell-${column.key}`" :row="row">{{
                    cellText(row, column.key)
                  }}</slot>
                </template>
              </div>
            </div>
          </div>
          <p
            v-if="secondary.length"
            class="m-0 flex flex-wrap gap-x-4 gap-y-1 text-muted"
            :class="isCompact ? 'text-meta' : 'text-sm'"
          >
            <span
              v-for="column in secondary"
              :key="column.key"
              class="inline-flex max-w-full min-w-0 items-center gap-1"
              :class="column.stacked && 'basis-full'"
            >
              <span v-if="!column.stacked" class="whitespace-nowrap">{{ column.label }}</span>
              <span
                class="min-w-0 [overflow-wrap:anywhere]"
                :class="[
                  column.stacked ? 'w-full' : 'text-content',
                  column.align === 'end' && 'font-mono tabular-nums whitespace-nowrap',
                  column.mono && 'font-mono',
                ]"
              >
                <slot :name="`cell-${column.key}`" :row="row">{{ cellText(row, column.key) }}</slot>
              </span>
            </span>
          </p>
          <div v-if="meta.length || $slots.actions" class="flex items-center gap-2">
            <AppButton
              v-if="meta.length"
              tone="ghost"
              size="sm"
              :class="isCompact && '-ml-2.5'"
              :aria-expanded="openDetails.has(rowKey(row))"
              :aria-controls="`${detailsId}-${index}`"
              @click="toggleDetails(rowKey(row))"
            >
              {{ $t('common.table.details') }}
              <template #icon>
                <ChevronDown
                  aria-hidden="true"
                  class="size-4 transition-transform"
                  :class="openDetails.has(rowKey(row)) && 'rotate-180'"
                  :stroke-width="1.75"
                />
              </template>
            </AppButton>
            <div v-if="$slots.actions" class="ml-auto flex shrink-0 flex-wrap items-center gap-2">
              <slot name="actions" :row="row" />
            </div>
          </div>
          <dl
            v-if="meta.length"
            v-show="openDetails.has(rowKey(row))"
            :id="`${detailsId}-${index}`"
            class="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm"
          >
            <template v-for="column in meta" :key="column.key">
              <dt class="text-muted">{{ column.label }}</dt>
              <dd class="m-0 min-w-0 break-words">
                <slot :name="`cell-${column.key}`" :row="row">{{ cellText(row, column.key) }}</slot>
              </dd>
            </template>
          </dl>
        </li>
      </ul>

      <!-- The table. -->
      <ScrollRegion v-else :label="label" no-hint @scroll.capture.passive="onScroll">
        <div :class="maxHeight && 'overflow-y-auto'" :style="frameStyle">
          <table class="w-full border-collapse text-sm [&_tbody_tr:last-child_td]:border-b-0">
            <caption class="sr-only">
              {{
                label
              }}
            </caption>
            <thead>
              <tr ref="headRow">
                <th
                  v-if="selectable"
                  scope="col"
                  :class="[HEAD_CELL, 'w-10', headPin(0).class]"
                  :style="headPin(0).style"
                >
                  <DataTableCheckbox
                    :checked="isAllPicked"
                    :indeterminate="isSomePicked"
                    :label="$t('common.table.selectPage')"
                    @change="toggleAll"
                  />
                </th>
                <th
                  v-for="(column, index) in columns"
                  :key="column.key"
                  scope="col"
                  :aria-sort="ariaSortOf(column.sort, sort)"
                  :class="[
                    HEAD_CELL,
                    HEAD_TEXT,
                    headPin(index + offset).class,
                    column.align === 'end' ? 'text-right' : 'text-left',
                    hiddenClass(column),
                  ]"
                  :style="headPin(index + offset).style"
                >
                  <span v-if="column.hideLabel" class="sr-only">{{ column.label }}</span>
                  <button
                    v-else-if="column.sort"
                    type="button"
                    :class="[SORT_BUTTON, ariaSortOf(column.sort, sort) && 'text-content']"
                    @click="sort = nextSort(column.sort, sort)"
                  >
                    {{ column.label }}
                    <ArrowUp
                      v-if="ariaSortOf(column.sort, sort) === 'ascending'"
                      aria-hidden="true"
                      class="size-3.5"
                    />
                    <ArrowDown
                      v-else-if="ariaSortOf(column.sort, sort) === 'descending'"
                      aria-hidden="true"
                      class="size-3.5"
                    />
                    <ChevronsUpDown v-else aria-hidden="true" class="size-3.5" />
                  </button>
                  <template v-else>{{ column.label }}</template>
                </th>
                <th
                  v-if="$slots.actions"
                  scope="col"
                  :class="[HEAD_CELL, 'sticky top-0 z-10 bg-surface-solid']"
                >
                  <span class="sr-only">{{ $t('common.table.actions') }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in rows"
                :key="rowKey(row)"
                v-bind="rowAttrs?.(row)"
                class="hover:bg-surface-hover"
                :class="[
                  selected.has(rowKey(row)) && 'bg-accent-soft hover:bg-accent-soft',
                  rowTo && 'cursor-pointer',
                ]"
                @click="openRow(row, $event)"
                @auxclick="openRowInTab(row, $event)"
              >
                <td v-if="selectable" :class="[CELL, bodyPin(0)?.class]" :style="bodyPin(0)?.style">
                  <DataTableCheckbox
                    :checked="selected.has(rowKey(row))"
                    :label="$t('common.table.selectRow', { name: labelOf(row) })"
                    @change="toggleRow(row, $event)"
                  />
                </td>
                <td
                  v-for="(column, index) in columns"
                  :key="column.key"
                  :class="[
                    CELL,
                    alignClass(column),
                    growClass(column),
                    column.cellClass,
                    hiddenClass(column),
                    bodyPin(index + offset)?.class,
                  ]"
                  :style="bodyPin(index + offset)?.style"
                >
                  <slot :name="`cell-${column.key}`" :row="row">
                    <RouterLink
                      v-if="rowTo && column === primary"
                      :to="rowTo(row)"
                      class="font-semibold hover:underline"
                    >
                      {{ cellText(row, column.key) }}
                    </RouterLink>
                    <template v-else>{{ cellText(row, column.key) }}</template>
                  </slot>
                </td>
                <td v-if="$slots.actions" :class="[CELL, 'w-px whitespace-nowrap']">
                  <div class="flex items-center justify-end gap-1">
                    <slot name="actions" :row="row" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ScrollRegion>
    </QueryState>

    <div
      v-if="hasFooter && (pager || $slots.footer)"
      class="flex flex-wrap items-center gap-3 border-t border-line px-3 py-2 text-sm text-muted"
    >
      <slot name="footer">
        <span v-if="range" class="font-mono tabular-nums">{{
          $t('common.table.range', range)
        }}</span>
        <NumberedPager
          v-if="pager"
          class="ml-auto"
          :compact="isCompact"
          :meta="pager.meta"
          :label="pager.label"
          :query-key="pager.queryKey"
        />
      </slot>
    </div>
  </div>
</template>

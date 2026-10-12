<script setup lang="ts" generic="Row">
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-vue-next';
import { computed } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import QueryState from '@/components/QueryState.vue';
import ScrollRegion from '@/components/ScrollRegion.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { CARD, buttonClass } from '../controls';
import AdminBulkBar from './AdminBulkBar.vue';
import { ariaSortOf, nextSort } from './table-columns';
import type { AdminColumn } from './table-columns';

/**
 * The admin list table (pages/admin.md, "Data tables"): a card with an optional toolbar, sortable headers, 40 px rows,
 * optional row selection with the bulk bar in place of the toolbar, row actions at the end, loading, error, empty and
 * filtered-empty states, and a footer (pager). Below 768 px each row is a card instead (see `table-columns.ts`); only one
 * of the two is rendered, so row hooks such as `data-code` (`rowAttrs`) exist once.
 *
 * Slots: `toolbar`, `bulk` (actions while rows are selected), `cell-<key>` ({ row }), `actions` ({ row }), `empty`, `footer`.
 * Models: `sort` (the `?sort=` value), `selected` (row keys). `selectable` adds the checkbox column.
 */
const props = withDefaults(
  defineProps<{
    columns: AdminColumn[];
    rows: readonly Row[];
    rowKey: (row: Row) => string;
    /** The table's caption, for screen readers. */
    label: string;
    rowLabel?: (row: Row) => string;
    rowAttrs?: (row: Row) => Record<string, string | undefined>;
    selectable?: boolean;
    loading?: boolean;
    error?: unknown;
    skeletonRows?: number;
    /** The list is empty because of a filter: offer "Xoá bộ lọc" (emits `clear-filters`). */
    filtered?: boolean;
    emptyText?: string;
    /** Caps the card's height so the header sticks while the rows scroll (a CSS length). */
    maxHeight?: string;
  }>(),
  {
    rowLabel: undefined,
    rowAttrs: undefined,
    selectable: false,
    loading: false,
    error: undefined,
    skeletonRows: 8,
    filtered: false,
    emptyText: undefined,
    maxHeight: undefined,
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
    empty?: () => unknown;
    footer?: () => unknown;
  } & Record<`cell-${string}`, (scope: { row: Row }) => unknown>
>();

const isPhone = useMediaQuery(PHONE_QUERY);
const labelOf = (row: Row) => props.rowLabel?.(row) ?? props.rowKey(row);
const byPriority = (priority: AdminColumn['priority']) =>
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

/** The default cell: a string or number field of the row; anything else needs a `cell-<key>` slot. */
const cellText = (row: Row, key: string) => {
  const value = (row as Record<string, unknown>)[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) || '—' : '—';
};
const alignClass = (column: AdminColumn) =>
  column.align === 'end' ? 'text-right font-mono tabular-nums' : 'text-left';
/**
 * `max-w-0` + `w-full` is the auto-layout idiom for "all the leftover width, never more": the content wraps or truncates
 * inside it. The column marked `grow` gets it, else the primary one: the name is what yields when the others need room.
 */
const growsOf = (column: AdminColumn) =>
  column.grow ?? (!props.columns.some((other) => other.grow) && column === primary.value);
const growClass = (column: AdminColumn) => growsOf(column) && 'w-full max-w-0';
/**
 * A table cell never asks for more than 16rem and lets an unbroken value (a long username, an IPv6 address) wrap, so one
 * long value cannot widen the table past its card; `:where()` keeps the cap at zero specificity for a column's own `cellClass`.
 */
const CELL =
  'h-[var(--qa-row,2.5rem)] border-b border-line px-3 align-middle [overflow-wrap:anywhere] [:where(&)]:max-w-64';
const CHECKBOX = 'size-4 accent-[var(--qh-accent)] align-middle';
const frameStyle = computed(() => (props.maxHeight ? { maxHeight: props.maxHeight } : undefined));
</script>

<template>
  <div :class="[CARD, 'flex min-w-0 flex-col overflow-hidden']">
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
        <div class="flex flex-col">
          <div
            v-for="index in skeletonRows"
            :key="index"
            :class="[CELL, 'flex items-center gap-4']"
          >
            <SkeletonBlock class="h-3.5 w-48" />
            <SkeletonBlock class="ml-auto h-3.5 w-16" />
          </div>
        </div>
      </template>

      <template v-if="rows.length === 0">
        <slot name="empty">
          <div v-if="filtered" class="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <p class="text-muted">{{ $t('admin.table.emptyFiltered') }}</p>
            <button
              type="button"
              :class="buttonClass('secondary', 'sm')"
              @click="$emit('clear-filters')"
            >
              {{ $t('admin.table.clearFilters') }}
            </button>
          </div>
          <EmptyState v-else>{{ emptyText ?? $t('admin.table.empty') }}</EmptyState>
        </slot>
      </template>

      <!-- Phone: one card per row. -->
      <ul v-else-if="isPhone" class="m-0 flex list-none flex-col p-0" :aria-label="label">
        <li
          v-for="row in rows"
          :key="rowKey(row)"
          v-bind="rowAttrs?.(row)"
          class="flex flex-col gap-1.5 border-b border-line px-4 py-3 last:border-b-0"
          :class="selected.has(rowKey(row)) && 'bg-accent-soft'"
        >
          <div class="flex min-w-0 items-start gap-3">
            <input
              v-if="selectable"
              type="checkbox"
              :class="[CHECKBOX, 'mt-1']"
              :checked="selected.has(rowKey(row))"
              :aria-label="$t('admin.table.selectRow', { name: labelOf(row) })"
              @change="toggleRow(row, ($event.target as HTMLInputElement).checked)"
            />
            <div class="min-w-0 flex-1">
              <slot :name="`cell-${primary!.key}`" :row="row">{{
                cellText(row, primary!.key)
              }}</slot>
            </div>
            <div v-if="badges.length" class="flex shrink-0 flex-wrap justify-end gap-1">
              <template v-for="column in badges" :key="column.key">
                <slot :name="`cell-${column.key}`" :row="row">{{ cellText(row, column.key) }}</slot>
              </template>
            </div>
          </div>
          <p v-if="secondary.length" class="m-0 flex flex-wrap gap-x-2 gap-y-1 text-sm text-muted">
            <template v-for="(column, index) in secondary" :key="column.key">
              <span v-if="index > 0 && !column.stacked" aria-hidden="true">·</span>
              <span
                class="inline-flex max-w-full min-w-0 items-baseline gap-1"
                :class="column.stacked && 'basis-full'"
              >
                <span v-if="!column.stacked" class="whitespace-nowrap">{{ column.label }}</span>
                <span
                  class="min-w-0 [overflow-wrap:anywhere]"
                  :class="[
                    column.stacked ? 'w-full' : 'text-content',
                    column.align === 'end' && 'font-mono tabular-nums whitespace-nowrap',
                  ]"
                >
                  <slot :name="`cell-${column.key}`" :row="row">{{
                    cellText(row, column.key)
                  }}</slot>
                </span>
              </span>
            </template>
          </p>
          <div v-if="meta.length || $slots.actions" class="flex items-start gap-2">
            <details v-if="meta.length" class="min-w-0 flex-1 text-sm">
              <summary class="w-fit cursor-pointer py-1 font-semibold text-accent-text">
                {{ $t('admin.table.details') }}
              </summary>
              <dl class="m-0 mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
                <template v-for="column in meta" :key="column.key">
                  <dt class="text-muted">{{ column.label }}</dt>
                  <dd class="m-0 min-w-0 break-words">
                    <slot :name="`cell-${column.key}`" :row="row">{{
                      cellText(row, column.key)
                    }}</slot>
                  </dd>
                </template>
              </dl>
            </details>
            <div v-if="$slots.actions" class="ml-auto flex shrink-0 flex-wrap items-center gap-2">
              <slot name="actions" :row="row" />
            </div>
          </div>
        </li>
      </ul>

      <!-- Desktop and tablet: the table. -->
      <ScrollRegion v-else :label="label" no-hint>
        <div :class="maxHeight && 'overflow-y-auto'" :style="frameStyle">
          <table class="w-full border-collapse text-sm [&_tbody_tr:last-child_td]:border-b-0">
            <caption class="sr-only">
              {{
                label
              }}
            </caption>
            <thead>
              <tr>
                <th
                  v-if="selectable"
                  scope="col"
                  :class="[CELL, 'sticky top-0 z-10 w-10 bg-surface-solid']"
                >
                  <input
                    type="checkbox"
                    :class="CHECKBOX"
                    :checked="isAllPicked"
                    :indeterminate="isSomePicked"
                    :aria-label="$t('admin.table.selectPage')"
                    @change="toggleAll"
                  />
                </th>
                <th
                  v-for="column in columns"
                  :key="column.key"
                  scope="col"
                  :aria-sort="ariaSortOf(column.sort, sort)"
                  :class="[
                    CELL,
                    'sticky top-0 z-10 h-9 bg-surface-solid text-xs font-semibold tracking-wide whitespace-nowrap text-muted uppercase',
                    column.align === 'end' ? 'text-right' : 'text-left',
                  ]"
                >
                  <span v-if="column.hideLabel" class="sr-only">{{ column.label }}</span>
                  <button
                    v-else-if="column.sort"
                    type="button"
                    class="inline-flex min-h-6 items-center gap-1 rounded-cell uppercase hover:text-content"
                    :class="ariaSortOf(column.sort, sort) && 'text-content'"
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
                  :class="[CELL, 'sticky top-0 z-10 h-9 bg-surface-solid']"
                >
                  <span class="sr-only">{{ $t('admin.table.actions') }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in rows"
                :key="rowKey(row)"
                v-bind="rowAttrs?.(row)"
                class="hover:bg-surface-hover"
                :class="selected.has(rowKey(row)) && 'bg-accent-soft hover:bg-accent-soft'"
              >
                <td v-if="selectable" :class="CELL">
                  <input
                    type="checkbox"
                    :class="CHECKBOX"
                    :checked="selected.has(rowKey(row))"
                    :aria-label="$t('admin.table.selectRow', { name: labelOf(row) })"
                    @change="toggleRow(row, ($event.target as HTMLInputElement).checked)"
                  />
                </td>
                <td
                  v-for="column in columns"
                  :key="column.key"
                  :class="[CELL, alignClass(column), growClass(column), column.cellClass]"
                >
                  <slot :name="`cell-${column.key}`" :row="row">{{
                    cellText(row, column.key)
                  }}</slot>
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
      v-if="$slots.footer && !loading && rows.length > 0"
      class="flex flex-wrap items-center gap-3 border-t border-line px-3 py-2 text-sm text-muted"
    >
      <slot name="footer" />
    </div>
  </div>
</template>

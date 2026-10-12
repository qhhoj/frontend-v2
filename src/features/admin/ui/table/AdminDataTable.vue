<script setup lang="ts" generic="Row">
import type { NumberedPageMeta } from '@/api/client';
import DataTable from '@/components/ui/DataTable.vue';
import type { AdminColumn } from './table-columns';

/**
 * The admin list table (pages/admin.md, "Data tables"): the shared `DataTable` at admin density, 40 px rows, stacking to
 * one card per row below 768 px. Props, models, events and slots are DataTable's.
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
    /** A numbered page: the footer shows its "1–50 / 312" range and the page links. */
    pager?: { meta: NumberedPageMeta; label: string; queryKey?: string };
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
    pager: undefined,
  },
);
const sort = defineModel<string | undefined>('sort');
const selected = defineModel<Set<string>>('selected', { default: () => new Set<string>() });
defineEmits<{ retry: []; 'clear-filters': [] }>();
const slots = defineSlots<
  {
    toolbar?: () => unknown;
    bulk?: (scope: { count: number }) => unknown;
    actions?: (scope: { row: Row }) => unknown;
    empty?: () => unknown;
    footer?: () => unknown;
  } & Record<`cell-${string}`, (scope: { row: Row }) => unknown>
>();
/** The `cell-<key>` slots the page fills; the others keep DataTable's default cell. */
const filledCells = () => props.columns.filter((column) => slots[`cell-${column.key}`]);
/** 767.98 px and below: Tailwind's `md` breakpoint, as `PHONE_QUERY`. */
const STACK_BELOW_PX = 768;
</script>

<template>
  <DataTable
    v-model:sort="sort"
    v-model:selected="selected"
    :columns="columns"
    :rows="rows"
    :row-key="rowKey"
    :label="label"
    :row-label="rowLabel"
    :row-attrs="rowAttrs"
    :selectable="selectable"
    :loading="loading"
    :error="error"
    :skeleton-rows="skeletonRows"
    :filtered="filtered"
    :empty-text="emptyText"
    :max-height="maxHeight"
    :pager="pager"
    density="compact"
    :stack-below="STACK_BELOW_PX"
    @retry="$emit('retry')"
    @clear-filters="$emit('clear-filters')"
  >
    <template v-if="$slots.toolbar" #toolbar><slot name="toolbar" /></template>
    <template v-if="$slots.bulk" #bulk="{ count }"><slot name="bulk" :count="count" /></template>
    <template v-for="column in filledCells()" :key="column.key" #[`cell-${column.key}`]="{ row }">
      <slot :name="`cell-${column.key}`" :row="row" />
    </template>
    <template v-if="$slots.actions" #actions="{ row }"><slot name="actions" :row="row" /></template>
    <template v-if="$slots.empty" #empty><slot name="empty" /></template>
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </DataTable>
</template>

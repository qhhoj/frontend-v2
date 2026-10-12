<script setup lang="ts">
import { computed, ref } from 'vue';
import Card from '@/components/ui/Card.vue';
import ScrollRegion from '@/components/ScrollRegion.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import {
  BODY_CELL_CLASSES,
  COLUMN_TIER_CLASS,
  HEADER_ROW_CLASSES,
  COMPACT_BELOW_PX,
  FULL_TABLE_CLASS,
  HEADER_CELL_CLASSES,
  TABLE_CARD_CLASS,
  fullColumnClass,
} from './submission-table-cells';
import type { ColumnKey, ColumnSlot } from './submission-table-cells';
import { useIsNarrow } from './use-card-compact';

/** Mirrors `SubmissionTable.vue` and `SubmissionCompactList.vue`: keep their card, table, header, cell and row classes in sync. */
const ROW_COUNT = 10;
const props = withDefaults(
  defineProps<{
    showProblem?: boolean;
    columnKeys?: readonly ColumnKey[];
    /** The signed-in list page's "Chọn" column (a 44 px cell, so rows are taller). */
    hasPickColumn?: boolean;
  }>(),
  { showProblem: true, columnKeys: undefined, hasPickColumn: false },
);
const bodyCell = BODY_CELL_CLASSES;
/** Header cell width, then the cell's own width, per column in the table's order. */
const COLUMNS = [
  { key: 'verdict', header: 'w-12', cell: 'w-[7.875rem]', isNumber: false },
  { key: 'problem', header: 'w-12', cell: 'w-40', isNumber: false },
  { key: 'user', header: 'w-16', cell: 'w-20', isNumber: false },
  { key: 'cost', header: 'w-20', cell: 'w-28', isNumber: true },
  { key: 'language', header: 'w-12', cell: 'w-12', isNumber: false },
  { key: 'when', header: 'w-10', cell: 'w-10', isNumber: false },
] as const;
const columns = computed(() =>
  COLUMNS.filter(
    (column) =>
      (props.showProblem || column.key !== 'problem') &&
      (!props.columnKeys || props.columnKeys.includes(column.key)),
  ),
);
const card = ref<{ $el: HTMLElement } | null>(null);
const isCompact = useIsNarrow(() => card.value?.$el ?? null, COMPACT_BELOW_PX);
const isShown = (key: ColumnKey) => columns.value.some((column) => column.key === key);
/** Only the full table has fixed column widths. */
const widthOf = (key: ColumnSlot) => fullColumnClass(key, !props.columnKeys);
const tierOf = (key: ColumnKey) => (props.columnKeys ? '' : (COLUMN_TIER_CLASS[key] ?? ''));
</script>

<template>
  <Card ref="card" as="div" data-testid="submission-table-card" :class="TABLE_CARD_CLASS">
    <ul v-if="isCompact" aria-hidden="true" class="m-0 list-none p-0">
      <li
        v-for="row in ROW_COUNT"
        :key="row"
        data-skeleton-region="row"
        class="flex items-center gap-3 border-t border-line px-3 py-2.5 first:border-t-0"
      >
        <SkeletonBlock class="h-12 w-24 shrink-0 self-start" />
        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <div v-if="isShown('problem')"><SkeletonBlock text class="w-32" /></div>
          <div class="text-meta"><SkeletonBlock text class="w-28" /></div>
          <div v-if="isShown('when') || isShown('language')" class="text-xs">
            <SkeletonBlock text class="w-24" />
          </div>
          <div v-if="isShown('cost')" class="text-xs"><SkeletonBlock text class="w-28" /></div>
        </div>
        <div class="flex shrink-0 flex-col items-center">
          <SkeletonBlock v-if="hasPickColumn" round class="size-11" />
          <SkeletonBlock class="size-7" />
        </div>
      </li>
    </ul>
    <ScrollRegion v-else placeholder label="">
      <table
        aria-hidden="true"
        class="w-full border-collapse text-sm"
        :class="columnKeys ? '' : FULL_TABLE_CLASS"
      >
        <thead>
          <tr :class="HEADER_ROW_CLASSES">
            <th v-if="hasPickColumn" scope="col" :class="[HEADER_CELL_CLASSES, widthOf('pick')]">
              <SkeletonBlock text class="w-10" />
            </th>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :class="[HEADER_CELL_CLASSES, widthOf(column.key), { 'text-right': column.isNumber }]"
            >
              <SkeletonBlock text :class="column.header" />
            </th>
            <th scope="col" :class="[HEADER_CELL_CLASSES, widthOf('source')]" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in ROW_COUNT"
            :key="row"
            data-skeleton-region="row"
            class="border-t border-line"
          >
            <td v-if="hasPickColumn" :class="bodyCell">
              <SkeletonBlock round class="size-11" />
            </td>
            <td
              v-for="column in columns"
              :key="column.key"
              :class="[bodyCell, tierOf(column.key), { 'text-right font-mono': column.isNumber }]"
            >
              <SkeletonBlock v-if="column.key === 'verdict'" :class="[column.cell, 'h-12']" />
              <SkeletonBlock v-else text :class="column.cell" />
            </td>
            <td :class="bodyCell"><SkeletonBlock class="size-7" /></td>
          </tr>
        </tbody>
      </table>
    </ScrollRegion>
  </Card>
</template>

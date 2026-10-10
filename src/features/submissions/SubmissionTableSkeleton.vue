<script setup lang="ts">
import { computed } from 'vue';
import GlassCard from '@/components/GlassCard.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import {
  BODY_CELL_CLASSES,
  COLUMN_WIDTH_CLASS,
  FULL_TABLE_MIN_WIDTH_CLASS,
  HEADER_CELL_CLASSES,
} from './submission-table-cells';
import type { ColumnKey } from './submission-table-cells';

/** Mirrors `SubmissionTable.vue`: keep its card, table, header and cell classes in sync. */
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
/** Header cell width, then the cell's own width, per column in the table's order. */
const COLUMNS = [
  { key: 'verdict', header: 'w-14', cell: 'w-16', isNumber: false },
  { key: 'problem', header: 'w-12', cell: 'w-40', isNumber: false },
  { key: 'user', header: 'w-16', cell: 'w-24', isNumber: false },
  { key: 'score', header: 'w-10', cell: 'w-10', isNumber: true },
  { key: 'time', header: 'w-14', cell: 'w-14', isNumber: true },
  { key: 'memory', header: 'w-14', cell: 'w-14', isNumber: true },
  { key: 'language', header: 'w-16', cell: 'w-16', isNumber: false },
  { key: 'when', header: 'w-14', cell: 'w-20', isNumber: false },
] as const;
const columns = computed(() =>
  COLUMNS.filter(
    (column) =>
      (props.showProblem || column.key !== 'problem') &&
      (!props.columnKeys || props.columnKeys.includes(column.key)),
  ),
);
/** Only the full table has fixed column widths. */
const widthOf = (key: ColumnKey | 'pick') => (props.columnKeys ? '' : COLUMN_WIDTH_CLASS[key]);
</script>

<template>
  <GlassCard as="div" data-testid="submission-table-card" class="overflow-hidden">
    <div class="overflow-x-auto">
      <table
        aria-hidden="true"
        class="w-full border-collapse text-[15px]"
        :class="columnKeys ? '' : `table-fixed ${FULL_TABLE_MIN_WIDTH_CLASS}`"
      >
        <thead>
          <tr class="text-left text-[13px] text-muted">
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
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in ROW_COUNT"
            :key="row"
            data-skeleton-region="row"
            class="border-t border-line"
          >
            <td v-if="hasPickColumn" :class="BODY_CELL_CLASSES">
              <SkeletonBlock round class="size-11" />
            </td>
            <td
              v-for="column in columns"
              :key="column.key"
              :class="[BODY_CELL_CLASSES, { 'text-right font-mono': column.isNumber }]"
            >
              <SkeletonBlock
                v-if="column.key === 'verdict'"
                pill
                class="h-7"
                :class="column.cell"
              />
              <template v-else-if="column.key === 'problem'">
                <!-- The real cell has the name and, under it, the code in a smaller font. -->
                <SkeletonBlock text :class="column.cell" />
                <div class="font-mono text-xs"><SkeletonBlock text class="w-16" /></div>
              </template>
              <span v-else-if="column.key === 'user'" class="flex items-center gap-2">
                <SkeletonBlock class="size-6 shrink-0" />
                <SkeletonBlock text :class="column.cell" />
              </span>
              <SkeletonBlock v-else text :class="column.cell" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </GlassCard>
</template>

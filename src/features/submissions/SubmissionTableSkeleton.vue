<script setup lang="ts">
import { computed, ref } from 'vue';
import ScrollRegion from '@/components/ScrollRegion.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import {
  COMPACT_BELOW_PX,
  FULL_TABLE_CLASS,
  NUMBER_CELLS,
  ROW_RULE,
  TABLE_CARD_CLASS,
  bodyCellClasses,
  cellsOf,
  fullCellClass,
  headerCellClasses,
  headerRowClasses,
} from './submission-table-cells';
import type { CellKind, ColumnKey } from './submission-table-cells';
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
/** The skeleton bar's width per cell. */
const BAR: Record<CellKind, string> = {
  verdict: 'w-12',
  score: 'w-20',
  problem: 'w-40',
  user: 'w-20',
  time: 'w-12',
  memory: 'w-14',
  language: 'w-16',
  when: 'w-10',
};
const ALL_KEYS: readonly ColumnKey[] = ['verdict', 'problem', 'user', 'cost', 'language', 'when'];
const shownKeys = computed(() =>
  ALL_KEYS.filter(
    (key) =>
      (props.showProblem || key !== 'problem') &&
      (!props.columnKeys || props.columnKeys.includes(key)),
  ),
);
const cells = computed(() => cellsOf(shownKeys.value));
const frame = ref<HTMLElement | null>(null);
const isCompact = useIsNarrow(() => frame.value, COMPACT_BELOW_PX);
const variant = 'ledger';
const bodyCell = bodyCellClasses(variant);
const headerCell = headerCellClasses(variant);
const classOf = (kind: CellKind | 'pick' | 'source') => fullCellClass(kind);
</script>

<template>
  <div ref="frame" data-testid="submission-table-card" :class="TABLE_CARD_CLASS">
    <ul v-if="isCompact" aria-hidden="true" class="m-0 list-none p-0">
      <li
        v-for="row in ROW_COUNT"
        :key="row"
        data-skeleton-region="row"
        class="flex min-h-(--qh-row) items-center gap-2 py-2"
        :class="ROW_RULE[variant]"
      >
        <SkeletonBlock v-if="hasPickColumn" round class="size-11 shrink-0" />
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <div class="flex items-center gap-2 text-sm">
            <SkeletonBlock class="h-5 w-12 shrink-0" />
            <SkeletonBlock v-if="shownKeys.includes('problem')" text class="w-32" />
          </div>
          <div class="text-caption leading-4"><SkeletonBlock text class="w-40" /></div>
        </div>
        <SkeletonBlock class="size-7 shrink-0" />
      </li>
    </ul>
    <ScrollRegion v-else placeholder label="">
      <table aria-hidden="true" class="w-full border-collapse" :class="FULL_TABLE_CLASS">
        <thead>
          <tr :class="headerRowClasses(variant)">
            <th v-if="hasPickColumn" scope="col" :class="[headerCell, classOf('pick')]">
              <SkeletonBlock text class="w-10" />
            </th>
            <th
              v-for="kind in cells"
              :key="kind"
              scope="col"
              :class="[headerCell, classOf(kind), { 'text-right': NUMBER_CELLS.has(kind) }]"
            >
              <SkeletonBlock text :class="BAR[kind]" />
            </th>
            <th scope="col" :class="[headerCell, classOf('source')]" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in ROW_COUNT"
            :key="row"
            data-skeleton-region="row"
            :class="ROW_RULE[variant]"
          >
            <td v-if="hasPickColumn" :class="bodyCell">
              <SkeletonBlock round class="size-11" />
            </td>
            <td
              v-for="kind in cells"
              :key="kind"
              :class="[bodyCell, classOf(kind), { 'text-right font-mono': NUMBER_CELLS.has(kind) }]"
            >
              <SkeletonBlock v-if="kind === 'verdict'" class="h-5 w-12" />
              <SkeletonBlock v-else text :class="BAR[kind]" />
            </td>
            <td :class="bodyCell"><SkeletonBlock class="size-7" /></td>
          </tr>
        </tbody>
      </table>
    </ScrollRegion>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import Card from '@/components/ui/Card.vue';
import ScrollRegion from '@/components/ScrollRegion.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import {
  BODY_CELL_CLASSES,
  COMPACT_BELOW_PX,
  FULL_TABLE_CLASS,
  HEADER_CELL_CLASSES,
  HEADER_ROW_CLASSES,
  NUMBER_CELLS,
  TABLE_CARD_CLASS,
  cellsOf,
  fullCellClass,
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
const card = ref<{ $el: HTMLElement } | null>(null);
const isCompact = useIsNarrow(() => card.value?.$el ?? null, COMPACT_BELOW_PX);
const classOf = (kind: CellKind | 'pick' | 'source') => fullCellClass(kind);
</script>

<template>
  <Card ref="card" as="div" data-testid="submission-table-card" :class="TABLE_CARD_CLASS">
    <ul v-if="isCompact" aria-hidden="true" class="m-0 list-none p-0">
      <li
        v-for="row in ROW_COUNT"
        :key="row"
        data-skeleton-region="row"
        class="flex items-center gap-2 border-t border-line px-3 py-2 first:border-t-0"
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
          <tr :class="HEADER_ROW_CLASSES">
            <th v-if="hasPickColumn" scope="col" :class="[HEADER_CELL_CLASSES, classOf('pick')]">
              <SkeletonBlock text class="w-10" />
            </th>
            <th
              v-for="kind in cells"
              :key="kind"
              scope="col"
              :class="[
                HEADER_CELL_CLASSES,
                classOf(kind),
                { 'text-right': NUMBER_CELLS.has(kind) },
              ]"
            >
              <SkeletonBlock text :class="BAR[kind]" />
            </th>
            <th scope="col" :class="[HEADER_CELL_CLASSES, classOf('source')]" />
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
              v-for="kind in cells"
              :key="kind"
              :class="[
                BODY_CELL_CLASSES,
                classOf(kind),
                { 'text-right font-mono': NUMBER_CELLS.has(kind) },
              ]"
            >
              <SkeletonBlock v-if="kind === 'verdict'" class="h-5 w-12" />
              <SkeletonBlock v-else text :class="BAR[kind]" />
            </td>
            <td :class="BODY_CELL_CLASSES"><SkeletonBlock class="size-7" /></td>
          </tr>
        </tbody>
      </table>
    </ScrollRegion>
  </Card>
</template>

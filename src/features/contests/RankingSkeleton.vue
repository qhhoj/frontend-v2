<script setup lang="ts">
import { computed } from 'vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import {
  DEFAULT_STATS_COLUMNS,
  NAME_COLUMN_MAX_REM,
  RANK_COLUMN_REM,
  TIME_COLUMN_REM,
  statsWidthRem,
  tableWidthRem,
} from './ranking-columns';

const props = defineProps<{ problemCount: number; hasTimeColumn: boolean }>();
const ROWS = 10;
/** Same columns and minimum width as RankingTable's desktop table (which scrolls sideways below it): rank, name, then the score and problem columns together. */
const columns = computed(() => {
  const stats = {
    ...DEFAULT_STATS_COLUMNS,
    timeRem: props.hasTimeColumn ? TIME_COLUMN_REM : null,
  };
  return `grid-template-columns: ${RANK_COLUMN_REM}rem ${NAME_COLUMN_MAX_REM}rem ${statsWidthRem(props.problemCount, stats)}rem; width: ${tableWidthRem(NAME_COLUMN_MAX_REM, props.problemCount, stats)}rem`;
});
</script>

<template>
  <div>
    <div
      data-skeleton-region="toolbar"
      class="flex items-center gap-2 border-b border-line px-3 py-2"
    >
      <SkeletonBlock class="h-(--qh-control) w-48" />
      <SkeletonBlock class="ml-auto h-(--qh-control-sm) w-24" />
    </div>
    <div
      data-skeleton-region="table-header"
      class="grid h-(--qh-row-dense) items-center border-b border-line-strong text-small"
      :style="columns"
    >
      <span class="block px-3"><SkeletonBlock text class="w-8" /></span>
      <span class="block px-2.5"><SkeletonBlock text class="w-24" /></span>
      <span class="block px-2.5"><SkeletonBlock text class="w-full" /></span>
    </div>
    <div
      v-for="row in ROWS"
      :key="row"
      data-skeleton-region="row"
      class="grid h-(--qh-row-dense) items-center border-b border-line font-mono text-sm"
      :style="columns"
    >
      <span class="block px-3"><SkeletonBlock text class="w-8" /></span>
      <span class="flex min-w-0 items-center gap-2 px-2.5">
        <SkeletonBlock class="size-6 shrink-0" />
        <SkeletonBlock text class="w-40 max-w-full" />
      </span>
      <span class="block px-2.5"><SkeletonBlock text class="w-full" /></span>
    </div>
  </div>
</template>

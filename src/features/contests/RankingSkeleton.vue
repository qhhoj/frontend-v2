<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import { computed } from 'vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { RANK_COLUMN_REM, statsWidthRem, tableMinWidthRem } from './ranking-columns';

const props = defineProps<{ problemCount: number; hasTimeColumn: boolean }>();
const ROWS = 10;
/** Same columns and minimum width as RankingTable's desktop table (which scrolls sideways below it): rank, name (the rest), then the score and problem columns together. */
const columns = computed(
  () =>
    `grid-template-columns: ${RANK_COLUMN_REM}rem minmax(0, 1fr) ${statsWidthRem(props.problemCount, props.hasTimeColumn)}rem; min-width: ${tableMinWidthRem(props.problemCount, props.hasTimeColumn)}rem`,
);
</script>

<template>
  <Card as="div" class="overflow-hidden">
    <div
      data-skeleton-region="toolbar"
      class="flex items-center gap-2 border-b border-line px-3 py-2"
    >
      <SkeletonBlock class="h-(--qh-control) w-48" />
      <SkeletonBlock class="ml-auto h-(--qh-control-sm) w-24" />
    </div>
    <div
      data-skeleton-region="table-header"
      class="grid items-center py-2.5 text-meta"
      :style="columns"
    >
      <span class="block px-5"><SkeletonBlock text class="w-8" /></span>
      <span class="block px-2.5"><SkeletonBlock text class="w-24" /></span>
      <span class="block px-2.5"><SkeletonBlock text class="w-full" /></span>
    </div>
    <div
      v-for="row in ROWS"
      :key="row"
      data-skeleton-region="row"
      class="grid h-(--qh-row-dense) items-center border-t border-line font-mono text-sm"
      :style="columns"
    >
      <span class="block px-5"><SkeletonBlock text class="w-8" /></span>
      <span class="flex min-w-0 items-center gap-2 px-2.5">
        <SkeletonBlock class="size-6 shrink-0" />
        <SkeletonBlock text class="w-40 max-w-full" />
      </span>
      <span class="block px-2.5"><SkeletonBlock text class="w-full" /></span>
    </div>
  </Card>
</template>

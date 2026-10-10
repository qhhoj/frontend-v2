<script setup lang="ts">
import { computed } from 'vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { RANK_COLUMN_REM, statsWidthRem } from './ranking-columns';

const props = defineProps<{ problemCount: number; hasTimeColumn: boolean }>();
const ROWS = 10;
/** Same columns as RankingTable: rank, name (the rest), then the score and problem columns together. */
const columns = computed(
  () =>
    `grid-template-columns: ${RANK_COLUMN_REM}rem minmax(0, 1fr) ${statsWidthRem(props.problemCount, props.hasTimeColumn)}rem`,
);
</script>

<template>
  <div class="glass overflow-hidden rounded-card">
    <p aria-hidden="true" class="px-5 pt-3 text-[13px] md:hidden">
      <SkeletonBlock text class="w-48" />
    </p>
    <div
      data-skeleton-region="table-header"
      class="grid items-center py-4 text-[13px]"
      :style="columns"
    >
      <span class="block px-5"><SkeletonBlock text class="w-8" /></span>
      <span class="block px-2.5"><SkeletonBlock text class="w-24" /></span>
      <span class="hidden px-2.5 sm:block"><SkeletonBlock text class="w-full" /></span>
    </div>
    <div
      v-for="row in ROWS"
      :key="row"
      data-skeleton-region="row"
      class="grid items-center border-t border-line py-2.5 font-mono text-sm"
      :style="columns"
    >
      <span class="block px-5"><SkeletonBlock text class="w-8" /></span>
      <span class="flex min-w-0 items-center gap-2 px-2.5">
        <SkeletonBlock class="size-6 shrink-0" />
        <SkeletonBlock text class="w-40 max-w-full" />
      </span>
      <span class="hidden px-2.5 sm:block"><SkeletonBlock text class="w-full" /></span>
    </div>
  </div>
</template>

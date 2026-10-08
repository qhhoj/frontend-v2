<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/**
 * The body of one overview card, sized like the loaded body (the heading row stays outside the query state):
 * the chart's lead line and its 640 x 220 plot, the heatmap's line and its 739 x 115 grid, or the contests table
 * (desktop: a 36 px header row and 37 px rows) and list (phone: 61 px rows, 12 px apart), five rows each.
 */
defineProps<{ part: 'chart' | 'heatmap' | 'contests' }>();
const CONTEST_ROWS = 5;
</script>

<template>
  <template v-if="part === 'chart'">
    <SkeletonBlock class="mt-1 h-5 w-56" />
    <SkeletonBlock class="mt-3 aspect-[640/220] w-full" />
  </template>
  <div v-else-if="part === 'heatmap'" class="mt-3 flex flex-col gap-3">
    <SkeletonBlock class="h-5 w-64" />
    <SkeletonBlock class="aspect-[739/115] w-full" />
  </div>
  <GlassCard v-else class="p-5">
    <SkeletonBlock class="h-7 w-40" />
    <div class="mt-3 hidden flex-col md:flex">
      <SkeletonBlock class="h-9" />
      <SkeletonBlock v-for="row in CONTEST_ROWS" :key="row" class="h-[37px]" />
    </div>
    <div class="mt-3 flex flex-col gap-3 md:hidden">
      <SkeletonBlock v-for="row in CONTEST_ROWS" :key="row" class="h-[61px]" />
    </div>
  </GlassCard>
</template>

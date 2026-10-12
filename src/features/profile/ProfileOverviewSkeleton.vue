<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/**
 * The body of one overview card, sized like the loaded body (the heading row stays outside the query state):
 * the chart's lead line, its four figures and its 300 px plot (280 on a phone), the heatmap's line and its 739 x 115 grid, or the contests table
 * (desktop: a 36 px header row and 37 px rows) and list (phone: 61 px rows, 12 px apart), five rows each.
 */
defineProps<{ part: 'chart' | 'heatmap' | 'contests' }>();
const CONTEST_ROWS = 5;
</script>

<template>
  <template v-if="part === 'chart'">
    <!-- the lead wraps to two lines on a phone -->
    <SkeletonBlock class="mt-1 h-10 w-56 sm:h-5" />
    <div class="mt-3 flex flex-col gap-3">
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SkeletonBlock v-for="tile in 4" :key="tile" class="h-[58px]" />
      </div>
      <SkeletonBlock class="h-[280px] sm:h-[300px]" />
    </div>
  </template>
  <div v-else-if="part === 'heatmap'" class="mt-3 flex flex-col gap-3">
    <SkeletonBlock class="h-5 w-64" />
    <div class="overflow-x-auto">
      <SkeletonBlock class="aspect-[739/115] w-full min-w-[46rem]" />
    </div>
  </div>
  <Card v-else class="p-5">
    <SkeletonBlock class="h-7 w-40" />
    <div class="mt-3 hidden flex-col md:flex">
      <SkeletonBlock class="h-9" />
      <SkeletonBlock v-for="row in CONTEST_ROWS" :key="row" class="h-[37px]" />
    </div>
    <div class="mt-3 flex flex-col gap-3 md:hidden">
      <SkeletonBlock v-for="row in CONTEST_ROWS" :key="row" class="h-[61px]" />
    </div>
  </Card>
</template>

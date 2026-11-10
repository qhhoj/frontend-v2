<script setup lang="ts">
import DataTable from '@/components/ui/DataTable.vue';
import { recentContestColumns } from './recent-contests';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/**
 * The body of one overview card, sized like the loaded body (the heading row stays outside the query state):
 * the chart's lead line, its latest-change line and its 300 px plot (280 on a phone), the heatmap's line and its 739 x 115 grid, or the recent-contests table
 * itself in its loading state (five rows).
 */
defineProps<{ part: 'chart' | 'heatmap' | 'contests' }>();
const CONTEST_ROWS = 5;
</script>

<template>
  <template v-if="part === 'chart'">
    <!-- the lead wraps to two lines on a phone -->
    <SkeletonBlock class="mb-3 h-10 w-56 sm:h-5" />
    <div class="flex flex-col gap-3">
      <SkeletonBlock class="h-7 w-48" />
      <SkeletonBlock class="h-70 sm:h-75" />
    </div>
  </template>
  <div v-else-if="part === 'heatmap'" class="flex flex-col gap-3">
    <SkeletonBlock class="h-5 w-64" />
    <div class="overflow-x-auto">
      <SkeletonBlock class="aspect-[739/115] w-full min-w-184" />
    </div>
  </div>
  <DataTable
    v-else
    :columns="recentContestColumns()"
    :rows="[]"
    :row-key="() => ''"
    :label="$t('profile.recent')"
    loading
    :skeleton-rows="CONTEST_ROWS"
  >
    <template #toolbar>
      <h2 class="text-title leading-5.5 font-semibold">{{ $t('profile.recent') }}</h2>
    </template>
  </DataTable>
</template>

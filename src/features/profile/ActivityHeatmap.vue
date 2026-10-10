<script setup lang="ts">
import { computed } from 'vue';
import type { ActivityResponse } from '@/api/types/users';
import { heatmapWeeks, monthStarts, todayIn, totalSubmissions } from '@/lib/activity-heatmap';
import type { HeatmapLevel } from '@/lib/activity-heatmap';

/**
 * The last 53 weeks of submissions, one square per day. Days are the activity's own zone's calendar days (`todayIn`), so a
 * contestant in Hanoi and one in Los Angeles see the same grid. Scales to the card width, never scrolls the page.
 */
const props = defineProps<{ activity: ActivityResponse }>();
const weeks = computed(() =>
  heatmapWeeks(props.activity.days, todayIn(props.activity.timezone, Date.now())),
);
/** A month label is dropped when it would touch the previous one (the first, partial month is followed closely by the next). */
const months = computed(() =>
  monthStarts(weeks.value).filter(
    (mark, index, all) => index === 0 || mark.column - all[index - 1]!.column >= MIN_LABEL_COLUMNS,
  ),
);
const total = computed(() => totalSubmissions(props.activity.days));
const HEAT_CLASSES: Record<HeatmapLevel, string> = {
  0: 'fill-surface-strong',
  1: 'fill-accent/30',
  2: 'fill-accent/55',
  3: 'fill-accent/80',
  4: 'fill-accent',
};
const LEVELS: HeatmapLevel[] = [0, 1, 2, 3, 4];
/** Geometry in SVG units: a 14-unit step per day or week, an 11-unit square, and a row of month labels on top. */
const MIN_LABEL_COLUMNS = 3;
const STEP = 14;
const SQUARE = 11;
const LABEL_ROW = 14;
const cellX = (column: number) => column * STEP;
const cellY = (row: number) => LABEL_ROW + row * STEP;
</script>

<template>
  <div class="flex flex-col gap-3">
    <p class="text-sm text-muted">
      {{ $t('ratingChart.activityLine', { count: total, zone: activity.timezone }) }}
    </p>
    <div class="overflow-x-auto">
      <svg
        role="img"
        :aria-label="$t('ratingChart.heatmapLabel')"
        viewBox="0 0 739 115"
        class="h-auto w-full min-w-[46rem]"
      >
        <text
          v-for="mark in months"
          :key="mark.column"
          :x="cellX(mark.column) > 700 ? 739 : cellX(mark.column) + 2"
          y="10"
          :text-anchor="cellX(mark.column) > 700 ? 'end' : 'start'"
          class="fill-muted text-[10px]"
        >
          {{ $t(`ratingChart.months.${mark.month}`) }}
        </text>
        <template v-for="(week, column) in weeks" :key="column">
          <template v-for="(cell, row) in week" :key="row">
            <rect
              v-if="cell"
              :x="cellX(column)"
              :y="cellY(row)"
              :width="SQUARE"
              :height="SQUARE"
              rx="2"
              :class="HEAT_CLASSES[cell.level]"
            >
              <title>
                {{ $t('ratingChart.cellTitle', { date: cell.date, count: cell.count }) }}
              </title>
            </rect>
          </template>
        </template>
      </svg>
    </div>
    <div class="flex items-center justify-end gap-1.5 text-xs text-muted">
      <span>{{ $t('ratingChart.less') }}</span>
      <svg
        v-for="level in LEVELS"
        :key="level"
        viewBox="0 0 11 11"
        class="size-3"
        aria-hidden="true"
      >
        <rect width="11" height="11" rx="2" :class="HEAT_CLASSES[level]" />
      </svg>
      <span>{{ $t('ratingChart.more') }}</span>
    </div>
  </div>
</template>

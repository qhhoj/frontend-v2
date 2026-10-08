<script setup lang="ts">
import { computed } from 'vue';
import type { RatingHistoryEntry } from '@/api/types/users';
import { translate } from '@/i18n';
import {
  bandGeometry,
  chartPoints,
  ratedHistory,
  ratingRange,
  ratingTicks,
  ratingY,
  tierBands,
} from '@/lib/rating-chart';
import type { ChartBox } from '@/lib/rating-chart';

/** Rating over the contests a viewer may see: tier bands behind a polyline, one dot per contest. Draws nothing without a rated contest. */
const props = defineProps<{ history: RatingHistoryEntry[] }>();
const BOX: ChartBox = { width: 640, height: 220, padding: 24 };
const rated = computed(() => ratedHistory(props.history));
const points = computed(() => chartPoints(props.history, BOX));
const range = computed(() => ratingRange(rated.value.map((entry) => entry.rating ?? 0)));
const bands = computed(() =>
  tierBands(range.value).map((band) => ({ ...band, ...bandGeometry(band, range.value, BOX) })),
);
const ticks = computed(() =>
  ratingTicks(range.value).map((rating) => ({ rating, y: ratingY(rating, range.value, BOX) })),
);
const polyline = computed(() => points.value.map((point) => `${point.x},${point.y}`).join(' '));
const best = computed(() =>
  points.value.reduce((top, point) => (point.rating > top.rating ? point : top)),
);
const current = computed(() => points.value.at(-1)!);
const label = computed(() =>
  translate('ratingChart.label', {
    count: points.value.length,
    max: best.value.rating,
    current: current.value.rating,
  }),
);
const pointTitle = (point: { contestName: string | null; rating: number }) =>
  translate('ratingChart.pointTitle', {
    contest: point.contestName ?? translate('ratingChart.hiddenContest'),
    rating: point.rating,
  });
</script>

<template>
  <svg
    v-if="points.length"
    role="img"
    :aria-label="label"
    viewBox="0 0 640 220"
    class="h-auto w-full"
  >
    <rect
      v-for="band in bands"
      :key="`${band.color}-${band.low}`"
      x="24"
      :y="band.y"
      width="592"
      :height="band.height"
      :class="`fill-tier-${band.color}`"
      fill-opacity="0.12"
    />
    <g v-for="tick in ticks" :key="tick.rating">
      <line x1="24" x2="616" :y1="tick.y" :y2="tick.y" class="stroke-line" stroke-width="1" />
      <text x="2" :y="tick.y + 3" class="fill-muted text-[10px]">{{ tick.rating }}</text>
    </g>
    <polyline :points="polyline" class="fill-none stroke-accent" stroke-width="2" />
    <circle
      v-for="(point, index) in points"
      :key="index"
      :cx="point.x"
      :cy="point.y"
      r="4"
      class="fill-accent"
    >
      <title>{{ pointTitle(point) }}</title>
    </circle>
    <text
      :x="best.x"
      :y="best.y - 10"
      text-anchor="middle"
      class="fill-content text-[11px] font-semibold"
    >
      {{ $t('ratingChart.best', { max: best.rating }) }}
    </text>
  </svg>
</template>

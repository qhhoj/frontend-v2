<script setup lang="ts">
import { computed } from 'vue';
import type { RatingHistoryEntry } from '@/api/types/users';
import { translate } from '@/i18n';
import {
  bandGeometry,
  chartPoints,
  ratedHistory,
  ratingRange,
  labelEvery,
  ratingLabelTicks,
  ratingY,
  tierBands,
} from '@/lib/rating-chart';
import { TIER_FILL_CLASSES } from '@/lib/tier-classes';
import type { ChartBox } from '@/lib/rating-chart';

/** Rating over the contests a viewer may see: tier bands behind a polyline, one dot per contest. Draws nothing without a rated contest. */
const props = defineProps<{ history: RatingHistoryEntry[] }>();
const BOX: ChartBox = { width: 640, height: 220, padding: 32 };
/** The plot runs between the padding on both sides; the best contest's dot is drawn larger than the others. */
const PLOT_LEFT = BOX.padding;
const PLOT_WIDTH = BOX.width - 2 * BOX.padding;
const PLOT_RIGHT = BOX.width - BOX.padding;
const MAX_POINT_RADIUS = 4;
const rated = computed(() => ratedHistory(props.history));
const points = computed(() => chartPoints(props.history, BOX));
const range = computed(() => ratingRange(rated.value.map((entry) => entry.rating ?? 0)));
const bands = computed(() =>
  tierBands(range.value).map((band) => ({ ...band, ...bandGeometry(band, range.value, BOX) })),
);
const ticks = computed(() =>
  ratingLabelTicks(range.value, BOX.height - 2 * BOX.padding).map((rating) => ({
    rating,
    y: ratingY(rating, range.value, BOX),
  })),
);
/** Dots shrink on a long history so neighbours never overlap. */
const pointRadius = computed(() =>
  points.value.length < 2
    ? MAX_POINT_RADIUS
    : Math.min(MAX_POINT_RADIUS, Math.max(1.5, (PLOT_WIDTH / (points.value.length - 1)) * 0.4)),
);
const polyline = computed(() => points.value.map((point) => `${point.x},${point.y}`).join(' '));
const best = computed(() =>
  points.value.reduce((top, point) => (point.rating > top.rating ? point : top)),
);
/** The best-point label is centred on the point; near an edge it starts or ends at the point instead (clear of the rating labels), so it is never cut. */
const bestLabel = computed(() => {
  const { x } = best.value;
  if (x > BOX.width - 70) return { x: x + pointRadius.value, anchor: 'end' };
  if (x < 70) return { x: Math.max(x, 40), anchor: 'start' };
  return { x, anchor: 'middle' };
});
const current = computed(() => points.value.at(-1)!);
/** Every n-th contest is labelled `#1, #3, …` along the bottom edge (n grows with the history), so the axis reads in contest order and the labels never touch. */
const xLabels = computed(() => {
  const every = Math.max(2, labelEvery(points.value.length, PLOT_WIDTH));
  return points.value.flatMap((point, index) =>
    index % every === 0 ? [{ x: point.x, text: `#${index + 1}` }] : [],
  );
});
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
    :viewBox="`0 0 ${BOX.width} ${BOX.height}`"
    class="h-auto w-full min-w-[32rem]"
  >
    <rect
      v-for="band in bands"
      :key="`${band.color}-${band.low}`"
      :x="PLOT_LEFT"
      :y="band.y"
      :width="PLOT_WIDTH"
      :height="band.height"
      :class="TIER_FILL_CLASSES[band.color]"
      fill-opacity="0.12"
    />
    <g v-for="tick in ticks" :key="tick.rating">
      <line
        :x1="PLOT_LEFT"
        :x2="PLOT_RIGHT"
        :y1="tick.y"
        :y2="tick.y"
        class="stroke-line"
        stroke-width="1"
      />
      <text x="2" :y="tick.y + 4" class="fill-muted text-[12px]">{{ tick.rating }}</text>
    </g>
    <polyline :points="polyline" class="fill-none stroke-accent" stroke-width="2" />
    <circle
      v-for="(point, index) in points"
      :key="index"
      :cx="point.x"
      :cy="point.y"
      :r="point === best ? pointRadius + 2 : pointRadius"
      class="fill-accent"
    >
      <title>{{ pointTitle(point) }}</title>
    </circle>
    <text
      v-for="mark in xLabels"
      :key="mark.text"
      :x="mark.x"
      :y="BOX.height - 6"
      text-anchor="middle"
      class="fill-muted text-[12px]"
    >
      {{ mark.text }}
    </text>
    <text
      :x="bestLabel.x"
      :y="best.y - 10"
      :text-anchor="bestLabel.anchor"
      class="fill-content text-[13px] font-semibold"
    >
      {{ $t('ratingChart.best', { max: best.rating }) }}
    </text>
  </svg>
</template>

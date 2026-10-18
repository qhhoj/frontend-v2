<script setup lang="ts">
import { formatDelta } from '@/lib/rating-delta';
import { computed, ref } from 'vue';
import type { RatingHistoryEntry } from '@/api/types/users';
import { translate } from '@/i18n';
import { formatDate, formatMonthYear } from '@/lib/format-date';
import {
  bandGeometry,
  chartPoints,
  labelledBands,
  labelledIndices,
  pointSpacing,
  ratedHistory,
  ratingLabelTicks,
  ratingRange,
  ratingY,
  tierBands,
  tooltipPosition,
  truncateLabel,
} from '@/lib/rating-chart';
import type { ChartBox, ChartPoint } from '@/lib/rating-chart';
import { ratingTier, tierColor } from '@/lib/rating-tiers';
import { TIER_FILL_CLASSES, TIER_STROKE_CLASSES } from '@/lib/tier-classes';
import { useLocaleStore } from '@/stores/locale.store';
import RatingStats from './RatingStats.vue';
import { useElementWidth } from './use-element-width';

/**
 * Rating over the contests a viewer may see: a row of four figures, then faint tier bands behind a line with a hollow dot per contest.
 * Hovering or focusing a contest shows its name, date, place, rating change and tier. Draws nothing without a rated contest.
 */
const props = defineProps<{ history: RatingHistoryEntry[] }>();
const locale = useLocaleStore();
const root = ref<HTMLElement | null>(null);
const width = useElementWidth(() => root.value, 640);

const PHONE_WIDTH = 480;
const NAME_SLOT = 80; // px per contest needed to print the contest name (cut to fit) under its dot
const AXIS_LEFT = 44;
const TOP = 18;
const LABEL_CHAR = 6.4;
const TOOLTIP_HEIGHT = 70;
const isPhone = computed(() => width.value < PHONE_WIDTH);
const height = computed(() => (isPhone.value ? 280 : 300));

const rated = computed(() => ratedHistory(props.history));
const range = computed(() => ratingRange(rated.value.map((entry) => entry.rating ?? 0)));
const tierName = (rating: number) => translate(`tiers.${ratingTier(rating)}`);
const bandName = (low: number) => {
  const key = ratingTier(low);
  return translate(isPhone.value ? `ratingChart.tierShort.${key}` : `tiers.${key}`);
};
/** The right margin holds the widest tier name. */
const rightMargin = computed(
  () =>
    Math.max(...tierBands(range.value).map((band) => bandName(band.low).length)) * LABEL_CHAR + 8,
);
const baseBox = computed<ChartBox>(() => ({
  width: width.value,
  height: height.value,
  left: AXIS_LEFT,
  right: rightMargin.value,
  top: TOP,
  bottom: 0,
}));
const spacing = computed(() => pointSpacing(rated.value.length, baseBox.value));
/** Few contests: each dot is named (name and date, two rows); many: dates only (one row). */
const showNames = computed(() => rated.value.length < 2 || spacing.value >= NAME_SLOT);
const box = computed<ChartBox>(() => ({ ...baseBox.value, bottom: showNames.value ? 44 : 30 }));
const plotRight = computed(() => box.value.width - box.value.right);

const points = computed(() => chartPoints(props.history, box.value));
const bands = computed(() =>
  tierBands(range.value).map((band) => ({
    ...band,
    ...bandGeometry(band, range.value, box.value),
  })),
);
const bandLabels = computed(() =>
  labelledBands(bands.value).map((band) => ({
    key: band.low,
    y: band.y + band.height / 2 + 4,
    text: bandName(band.low),
    colorClass: TIER_FILL_CLASSES[band.color],
  })),
);
/** A dotted line at the lower edge of each band but the lowest. */
const boundaries = computed(() =>
  bands.value.slice(1).map((band) => ({
    key: band.low,
    y: band.y + band.height,
    colorClass: TIER_STROKE_CLASSES[band.color],
  })),
);
const ticks = computed(() =>
  ratingLabelTicks(range.value, box.value.height - box.value.top - box.value.bottom, 32).map(
    (rating) => ({ rating, y: ratingY(rating, range.value, box.value) }),
  ),
);
const best = computed(() =>
  points.value.reduce((top, point) => (point.rating > top.rating ? point : top)),
);
const current = computed(() => points.value.at(-1)!);

const dateOf = (point: ChartPoint) => formatDate(point.endTime, 'date', locale.locale);
const xLabels = computed(() => {
  const labelled = labelledIndices(
    points.value.length,
    spacing.value,
    showNames.value ? NAME_SLOT : 44,
  );
  const marks = labelled.map((index) => {
    const point = points.value[index]!;
    return {
      key: index,
      x: point.x,
      name: showNames.value
        ? truncateLabel(
            point.contestName ?? translate('ratingChart.hiddenContest'),
            spacing.value - 16,
          )
        : null,
      date: showNames.value ? dateOf(point) : formatMonthYear(point.endTime),
    };
  });
  // Two labelled contests in one month would print the same text twice: keep the first.
  return marks.filter((mark, index) => showNames.value || mark.date !== marks[index - 1]?.date);
});

const label = computed(() =>
  translate('ratingChart.label', {
    count: points.value.length,
    max: best.value.rating,
    current: current.value.rating,
  }),
);
const contestTitle = (point: ChartPoint) =>
  point.contestName ?? translate('ratingChart.hiddenContest');
/** The tooltip's three rows, as text for screen readers and as the drawn rows. */
const rows = (point: ChartPoint) => ({
  name: contestTitle(point),
  place: [
    dateOf(point),
    ...(point.rank === null ? [] : [translate('ratingChart.place', { rank: point.rank })]),
  ].join(' · '),
  rating: String(point.rating),
  delta: point.delta === null ? '' : `(${formatDelta(point.delta)})`,
  tier: tierName(point.rating),
});
const spoken = (point: ChartPoint) => {
  const row = rows(point);
  return `${row.name}, ${row.place}, ${row.rating} ${row.delta} ${row.tier}`.replace(/ {2}/g, ' ');
};

const active = ref<number | null>(null);
const activePoint = computed(() => (active.value === null ? null : points.value[active.value]!));
const tooltip = computed(() => {
  const point = activePoint.value;
  if (!point) return null;
  const row = rows(point);
  const name = truncateLabel(row.name, 220);
  const ratingRow = (row.rating.length + row.delta.length) * 7.5 + row.tier.length * 6.4 + 6;
  const widest = Math.max(name.length * 6.4, row.place.length * 6.2, ratingRow, 150);
  const size = { width: widest + 20, height: TOOLTIP_HEIGHT };
  return {
    ...tooltipPosition(point, size, box.value),
    ...size,
    name,
    place: row.place,
    rating: row.rating,
    delta: row.delta,
    deltaClass: !point.delta ? 'fill-muted' : point.delta > 0 ? 'fill-positive' : 'fill-negative',
    tier: row.tier,
    tierClass: TIER_FILL_CLASSES[tierColor(ratingTier(point.rating))],
  };
});
const hitWidth = computed(() => Math.max(spacing.value, 24));
</script>

<template>
  <div v-if="points.length" ref="root" class="flex flex-col gap-3">
    <RatingStats
      :current="current.rating"
      :max="best.rating"
      :count="points.length"
      :delta="current.delta"
    />
    <svg
      role="group"
      :aria-label="label"
      :viewBox="`0 0 ${box.width} ${box.height}`"
      :width="box.width"
      :height="box.height"
      class="block h-auto w-full overflow-visible"
      @pointerleave="active = null"
      @keydown.esc="active = null"
    >
      <rect
        v-for="band in bands"
        :key="band.low"
        :x="box.left"
        :y="band.y"
        :width="plotRight - box.left"
        :height="band.height"
        :class="TIER_FILL_CLASSES[band.color]"
        fill-opacity="0.09"
      />
      <line
        v-for="line in boundaries"
        :key="line.key"
        :x1="box.left"
        :x2="plotRight"
        :y1="line.y"
        :y2="line.y"
        :class="line.colorClass"
        stroke-opacity="0.35"
        stroke-dasharray="1 4"
        stroke-linecap="round"
      />
      <text
        v-for="item in bandLabels"
        :key="item.key"
        :x="plotRight + 8"
        :y="item.y"
        :class="item.colorClass"
        class="text-caption font-semibold"
      >
        {{ item.text }}
      </text>
      <text
        v-for="tick in ticks"
        :key="tick.rating"
        :x="box.left - 8"
        :y="tick.y + 4"
        text-anchor="end"
        class="fill-muted text-caption tabular-nums"
      >
        {{ tick.rating }}
      </text>
      <polyline
        :points="points.map((point) => `${point.x},${point.y}`).join(' ')"
        class="fill-none stroke-accent"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      <circle
        v-for="(point, index) in points"
        :key="index"
        :cx="point.x"
        :cy="point.y"
        :r="index === active ? 6 : points.length > 12 ? 3 : 4.5"
        stroke-width="2"
        class="stroke-accent"
        :class="index === active ? 'fill-accent' : 'fill-surface-solid'"
      />
      <circle
        :cx="best.x"
        :cy="best.y"
        r="7.5"
        fill="none"
        class="stroke-content"
        stroke-opacity="0.35"
        stroke-dasharray="2 2"
      />
      <g v-for="mark in xLabels" :key="mark.key" class="fill-muted text-caption">
        <text v-if="mark.name" :x="mark.x" :y="box.height - 28" text-anchor="middle">
          {{ mark.name }}
        </text>
        <text
          :x="mark.x"
          :y="box.height - (mark.name ? 13 : 12)"
          text-anchor="middle"
          class="tabular-nums"
        >
          {{ mark.date }}
        </text>
      </g>
      <line
        v-if="activePoint"
        :x1="activePoint.x"
        :x2="activePoint.x"
        :y1="box.top"
        :y2="box.height - box.bottom"
        class="stroke-content"
        stroke-opacity="0.25"
      />
      <rect
        v-for="(point, index) in points"
        :key="`hit-${index}`"
        :x="point.x - hitWidth / 2"
        :y="box.top"
        :width="hitWidth"
        :height="box.height - box.top - box.bottom"
        fill="transparent"
        role="img"
        tabindex="0"
        class="outline-none"
        :aria-label="spoken(point)"
        @pointerenter="active = index"
        @focus="active = index"
        @blur="active = null"
      />
      <g v-if="tooltip" class="pointer-events-none">
        <rect
          :x="tooltip.x"
          :y="tooltip.y"
          :width="tooltip.width"
          :height="tooltip.height"
          rx="8"
          class="fill-surface-solid stroke-line-strong"
        />
        <text
          :x="tooltip.x + 10"
          :y="tooltip.y + 19"
          class="fill-content text-caption font-semibold"
        >
          {{ tooltip.name }}
        </text>
        <text :x="tooltip.x + 10" :y="tooltip.y + 37" class="fill-muted text-caption tabular-nums">
          {{ tooltip.place }}
        </text>
        <text
          :x="tooltip.x + 10"
          :y="tooltip.y + 57"
          class="fill-content text-meta font-semibold tabular-nums"
        >
          {{ tooltip.rating }}
          <tspan :class="tooltip.deltaClass">{{ tooltip.delta }}</tspan>
          <tspan :class="tooltip.tierClass" class="text-caption font-normal" dx="6">
            {{ tooltip.tier }}
          </tspan>
        </text>
      </g>
    </svg>
  </div>
</template>

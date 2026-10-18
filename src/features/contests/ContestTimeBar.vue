<script setup lang="ts">
import { computed } from 'vue';
import type { ContestDetail } from '@/api/types/contests';
import { contestProgress, freezeFraction, freezeStart } from '@/lib/contest-time';
import { formatClock } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { timelineLabels } from './contest-clock';

const props = defineProps<{ contest: ContestDetail; now: number }>();
const locale = useLocaleStore();
const filledPercent = computed(() => contestProgress(props.contest, props.now) * 100);
const freezePercent = computed(() => {
  const fraction = freezeFraction(props.contest);
  return fraction === null ? null : fraction * 100;
});
/** Closer than this share of the bar to the end, the centred freeze label would run past the bar's right edge: it sits flush right instead. */
const NEAR_END_PERCENT = 10;
const isFreezeNearEnd = computed(
  () => freezePercent.value !== null && 100 - freezePercent.value < NEAR_END_PERCENT,
);
/** Stripes in the theme's line and surface tokens, as the approved mock draws the frozen stretch. */
const FREEZE_HATCH =
  'repeating-linear-gradient(45deg, var(--color-line-strong) 0 4px, var(--color-surface-hover) 4px 8px)';
/** The contest's two ends, written once under the bar (P-23), with dates when they fall on different days (P-18). */
const labels = computed(() => timelineLabels(props.contest, locale.locale));
const freezeClock = computed(() => {
  const from = freezeStart(props.contest);
  return from === null ? '' : formatClock(new Date(from).toISOString());
});
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div
      v-if="freezePercent !== null"
      class="relative hidden h-5 font-mono text-caption text-muted tabular-nums md:block"
    >
      <!-- Under 10 % from the end the centred label would run off the bar: it sits flush right instead. -->
      <span
        data-testid="freeze-label"
        class="absolute font-semibold whitespace-nowrap text-verdict-tle"
        :class="isFreezeNearEnd ? 'right-0' : '-translate-x-1/2'"
        :style="isFreezeNearEnd ? undefined : { left: `${freezePercent}%` }"
        >{{ $t('contests.detail.freezeAt', { time: freezeClock }) }}</span
      >
    </div>
    <div aria-hidden="true" class="relative h-2 overflow-hidden rounded-pill bg-surface-hover">
      <span
        v-if="freezePercent !== null"
        data-testid="freeze-hatch"
        class="absolute inset-y-0"
        :style="{
          left: `${freezePercent}%`,
          width: `${100 - freezePercent}%`,
          backgroundImage: FREEZE_HATCH,
        }"
      />
      <span
        class="absolute inset-y-0 left-0 rounded-pill bg-accent"
        :style="{ width: `${filledPercent}%` }"
      />
    </div>
    <p
      data-testid="timeline-labels"
      class="flex justify-between gap-3 font-mono text-caption text-muted tabular-nums"
    >
      <time :datetime="contest.startTime">{{ labels.start }}</time>
      <time :datetime="contest.endTime">{{ labels.end }}</time>
    </p>
  </div>
</template>

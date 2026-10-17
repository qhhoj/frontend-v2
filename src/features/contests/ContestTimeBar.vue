<script setup lang="ts">
import { computed } from 'vue';
import type { ContestDetail } from '@/api/types/contests';
import { contestProgress, freezeFraction, freezeStart } from '@/lib/contest-time';
import { formatClock } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

const props = defineProps<{ contest: ContestDetail; now: number }>();
const locale = useLocaleStore();
const filledPercent = computed(() => contestProgress(props.contest, props.now) * 100);
const freezePercent = computed(() => {
  const fraction = freezeFraction(props.contest);
  return fraction === null ? null : fraction * 100;
});
/** The share of the bar under which the freeze label would run into the end label. */
const NEAR_END_PERCENT = 10;
const isFreezeNearEnd = computed(
  () => freezePercent.value !== null && 100 - freezePercent.value < NEAR_END_PERCENT,
);
/** Stripes in the theme's line and surface tokens, as the approved mock draws the frozen stretch. */
const FREEZE_HATCH =
  'repeating-linear-gradient(45deg, var(--color-line-strong) 0 4px, var(--color-surface-hover) 4px 8px)';
const freezeClock = computed(() => {
  const from = freezeStart(props.contest);
  return from === null ? '' : formatClock(new Date(from).toISOString(), locale.locale);
});
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="relative hidden h-5 font-mono text-caption text-muted tabular-nums md:block">
      <span class="absolute left-0">{{ formatClock(contest.startTime, locale.locale) }}</span>
      <span
        v-if="freezePercent !== null && !isFreezeNearEnd"
        data-testid="freeze-label"
        class="absolute -translate-x-1/2 font-semibold whitespace-nowrap text-verdict-tle"
        :style="{ left: `${freezePercent}%` }"
        >{{ $t('contests.detail.freezeAt', { time: freezeClock }) }}</span
      >
      <span class="absolute right-0 flex gap-3">
        <!-- Under 10 % from the end the centred label would cover the end time: it moves left, next to it. -->
        <span
          v-if="freezePercent !== null && isFreezeNearEnd"
          data-testid="freeze-label"
          class="font-semibold whitespace-nowrap text-verdict-tle"
          >{{ $t('contests.detail.freezeAt', { time: freezeClock }) }}</span
        >
        <span>{{ formatClock(contest.endTime, locale.locale) }}</span>
      </span>
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
  </div>
</template>

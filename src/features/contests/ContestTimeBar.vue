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
        v-if="freezePercent !== null"
        data-testid="freeze-label"
        class="absolute -translate-x-1/2 font-semibold whitespace-nowrap text-verdict-tle"
        :style="{ left: `${freezePercent}%` }"
        >{{ $t('contests.detail.freezeAt', { time: freezeClock }) }}</span
      >
      <span class="absolute right-0">{{ formatClock(contest.endTime, locale.locale) }}</span>
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

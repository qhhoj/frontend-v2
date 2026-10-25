<script setup lang="ts">
import { computed, watch } from 'vue';
import type { ContestDetail, ParticipationSummary } from '@/api/types/contests';
import Chip from '@/components/ui/Chip.vue';
import BitLoop from '@/components/BitLoop.vue';
import CountdownTimer from '@/components/CountdownTimer.vue';
import InlineBit from '@/components/InlineBit.vue';
import {
  LONG_COUNTDOWN_SECONDS,
  countdownTarget,
  freezeStart,
  ownEndTime,
} from '@/lib/contest-time';
import { formatClock, formatDate } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';

/**
 * `virtualRun`: the viewer's running virtual run of this ended contest; the big clock counts its time left.
 * `liveRun`: the viewer's running live participation; its own window (a timed contest) can close before the contest does.
 */
const props = defineProps<{
  contest: ContestDetail;
  virtualRun?: ParticipationSummary | null;
  liveRun?: ParticipationSummary | null;
}>();
const emit = defineEmits<{ elapsed: [] }>();
const locale = useLocaleStore();
const now = useNow();
/** Follows the clock (start, then end, then nothing) even before the refetch answers. */
const target = computed(() => {
  const contestTarget = countdownTarget(props.contest, now.value);
  if (contestTarget?.kind !== 'end') return contestTarget;
  return { kind: 'end' as const, at: ownEndTime(contestTarget.at, props.liveRun) };
});
/**
 * The target moved on (start to end, end to none): the page refetches for the new phase. Counted from the
 * clock rather than from the timer's own zero, which the flip can unmount before it fires.
 */
watch(
  () => target.value?.at,
  () => emit('elapsed'),
);
/** Days and hours (`28 ngày 14 giờ`) are longer than a clock: one line at the stat size instead of the hero's. */
const isLong = (until: string) => Date.parse(until) - now.value >= LONG_COUNTDOWN_SECONDS * 1000;
const sizeOf = (until: string) => (isLong(until) ? 'text-stat' : 'text-stat md:text-hero');
const instantLabel = (instant: string) => formatDate(instant, 'datetime', locale.locale);
const LABELS = { start: 'contests.detail.notStarted', end: 'contests.detail.timeLeft' } as const;
const freezeClock = computed(() => {
  const from = freezeStart(props.contest);
  return from === null ? null : formatClock(new Date(from).toISOString());
});
</script>

<template>
  <div v-if="virtualRun" data-testid="virtual-countdown" class="flex flex-col gap-1">
    <p class="text-meta text-muted">
      {{ $t('contests.detail.endedAt', { time: instantLabel(contest.endTime) }) }}
    </p>
    <p class="mt-1 flex items-center gap-2">
      <Chip tone="accent" size="md">{{
        $t('contestBar.virtual', { run: virtualRun.virtual })
      }}</Chip>
      <span class="text-caption font-semibold tracking-wider text-muted uppercase">{{
        $t('contests.detail.timeLeft')
      }}</span>
    </p>
    <p :class="['leading-tight font-semibold whitespace-nowrap', sizeOf(virtualRun.endTime)]">
      <!-- The run's end leaves the hero's virtual view: the page reads the contest again for its new state. -->
      <CountdownTimer
        :key="virtualRun.endTime"
        :until="virtualRun.endTime"
        @elapsed="emit('elapsed')"
      />
    </p>
  </div>
  <div v-else class="flex items-center gap-3">
    <!-- Upcoming: the stopwatch Bit, bigger from md up. Running: the same loop at the one notice size. -->
    <BitLoop
      v-if="target?.kind === 'start'"
      data-testid="countdown-bit"
      kind="contest"
      class="[--bit-px:3px] md:[--bit-px:4px]"
    />
    <InlineBit v-else-if="target?.kind === 'end'" kind="contest" />
    <div v-if="target" class="flex-1">
      <p class="text-caption font-semibold tracking-wider text-muted uppercase">
        {{ $t(LABELS[target.kind]) }}
      </p>
      <p :class="['leading-tight font-semibold whitespace-nowrap', sizeOf(target.at)]">
        <CountdownTimer :key="target.at" :until="target.at" />
      </p>
    </div>
    <p v-else class="flex-1 text-muted">
      {{ $t('contests.detail.endedAt', { time: instantLabel(contest.endTime) }) }}
    </p>
    <p
      v-if="target?.kind === 'end' && freezeClock"
      class="text-right text-caption text-muted md:hidden"
    >
      {{ $t('contests.detail.freeze')
      }}<b class="block font-mono text-verdict-tle">{{ freezeClock }}</b>
    </p>
  </div>
</template>

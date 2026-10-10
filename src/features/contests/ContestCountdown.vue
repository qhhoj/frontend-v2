<script setup lang="ts">
import { computed, watch } from 'vue';
import type { ContestDetail } from '@/api/types/contests';
import BitLoop from '@/components/BitLoop.vue';
import CountdownTimer from '@/components/CountdownTimer.vue';
import InlineBit from '@/components/InlineBit.vue';
import { countdownTarget, freezeStart } from '@/lib/contest-time';
import { formatClock, formatShortDate } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';

const props = defineProps<{ contest: ContestDetail }>();
const emit = defineEmits<{ elapsed: [] }>();
const locale = useLocaleStore();
const now = useNow();
/** Follows the clock (start, then end, then nothing) even before the refetch answers. */
const target = computed(() => countdownTarget(props.contest, now.value));
/**
 * The target moved on (start to end, end to none): the page refetches for the new phase. Counted from the
 * clock rather than from the timer's own zero, which the flip can unmount before it fires.
 */
watch(
  () => target.value?.at,
  () => emit('elapsed'),
);
const instantLabel = (instant: string) =>
  `${formatClock(instant, locale.locale)} · ${formatShortDate(instant, locale.locale)}`;
const LABELS = { start: 'contests.detail.notStarted', end: 'contests.detail.timeLeft' } as const;
const CAPTIONS = { start: 'contests.detail.startsAt', end: 'contests.detail.endsAt' } as const;
const freezeClock = computed(() => {
  const from = freezeStart(props.contest);
  return from === null ? null : formatClock(new Date(from).toISOString(), locale.locale);
});
</script>

<template>
  <div class="flex items-center gap-3">
    <!-- Upcoming: the stopwatch Bit, bigger from md up. Running: the same loop at the one notice size. -->
    <BitLoop
      v-if="target?.kind === 'start'"
      data-testid="countdown-bit"
      kind="contest"
      class="[--bit-px:3px] md:[--bit-px:4px]"
    />
    <InlineBit v-else-if="target?.kind === 'end'" kind="contest" />
    <div v-if="target" class="flex-1">
      <p class="text-[12px] font-semibold tracking-wider text-muted uppercase">
        {{ $t(LABELS[target.kind]) }}
      </p>
      <p class="font-mono text-3xl leading-tight font-semibold md:text-5xl">
        <CountdownTimer :key="target.at" :until="target.at" />
      </p>
      <p class="text-[13px] text-muted">
        {{ $t(CAPTIONS[target.kind], { time: instantLabel(target.at) }) }}
      </p>
    </div>
    <p v-else class="flex-1 text-muted">
      {{ $t('contests.detail.endedAt', { time: instantLabel(contest.endTime) }) }}
    </p>
    <p
      v-if="target?.kind === 'end' && freezeClock"
      class="text-right text-[12px] text-muted md:hidden"
    >
      {{ $t('contests.detail.freeze')
      }}<b class="block font-mono text-verdict-tle">{{ freezeClock }}</b>
    </p>
  </div>
</template>

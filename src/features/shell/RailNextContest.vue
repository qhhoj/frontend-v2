<script setup lang="ts">
import { CalendarClock, Timer } from 'lucide-vue-next';
import { computed } from 'vue';
import { CUE_TEXT } from '@/components/ui/cue-tones';
import StatusDot from '@/components/ui/StatusDot.vue';
import StretchedLink from '@/components/ui/StretchedLink.vue';
import { useSpanText } from '@/features/contests/use-span-text';
import { spanMessage } from '@/lib/contest-time';
import { formatDate } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import type { NextContest } from './use-next-contest';

/**
 * The rail's block for the contest to look at next when the viewer is in none: the running one (green) or else the
 * soonest upcoming one (blue). The whole block is the link. It says the name, how long until it starts (or ends) and
 * the date. `AppRail` leaves it out where the page already shows that contest (home, contest list, the contest's own
 * pages) and while the viewer takes part (`RailLiveContest` shows then). On the narrow rail it is the icon with a cue dot; the
 * name stays its accessible name. Minute precision is enough, so the clock ticks every 30 seconds.
 */
const props = defineProps<{ next: NextContest }>();
const locale = useLocaleStore();
const spanText = useSpanText();
const now = useNow(30_000);
const isRunning = computed(() => props.next.phase === 'running');
const tone = computed(() => (isRunning.value ? 'live' : 'upcoming'));
/** Seconds to the end of a running contest, or to the start of an upcoming one. */
const secondsLeft = computed(() => {
  const target = isRunning.value ? props.next.contest.endTime : props.next.contest.startTime;
  return Math.max(0, (Date.parse(target) - now.value) / 1000);
});
const whenText = computed(() => spanText(spanMessage(secondsLeft.value)));
</script>

<template>
  <div
    data-testid="rail-next-contest"
    :title="next.contest.name"
    class="box-link flex flex-col gap-1 rounded-card bg-surface p-3 transition-colors rail-slim:items-center rail-slim:p-2"
  >
    <p class="text-caption leading-4 text-muted rail-slim:hidden">{{ $t('rail.next.title') }}</p>
    <StretchedLink
      :to="{ name: 'contest', params: { key: next.contest.key } }"
      class="truncate text-body font-semibold text-content rail-slim:sr-only"
      >{{ next.contest.name }}</StretchedLink
    >
    <span
      :class="['flex items-center gap-1.5 text-caption leading-4 font-semibold', CUE_TEXT[tone]]"
      class="rail-slim:hidden"
    >
      <StatusDot :tone="tone" />
      <span data-testid="rail-next-when">{{
        isRunning
          ? $t('contests.list.timeLeft', { span: whenText })
          : $t('rail.next.startsIn', { span: whenText })
      }}</span>
    </span>
    <span class="text-caption leading-4 text-muted rail-slim:hidden">{{
      isRunning
        ? $t('rail.next.endsAt', {
            date: formatDate(next.contest.endTime, 'datetime', locale.locale),
          })
        : formatDate(next.contest.startTime, 'datetime', locale.locale)
    }}</span>
    <!-- The narrow rail: the icon and its cue dot; the name above stays the accessible name. -->
    <span class="relative hidden rail-slim:block">
      <component
        :is="isRunning ? Timer : CalendarClock"
        aria-hidden="true"
        class="size-4 text-muted"
      />
      <StatusDot :tone="tone" class="absolute -top-0.5 -right-1" />
    </span>
  </div>
</template>

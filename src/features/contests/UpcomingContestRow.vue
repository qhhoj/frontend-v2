<script setup lang="ts">
import { computed } from 'vue';
import type { ContestListItem } from '@/api/types/contests';
import { spanMessage } from '@/lib/contest-time';
import { formatClock, formatDayMonth, formatNumber, formatRelative } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import ContestChips from './ContestChips.vue';
import { endClockLabel } from './contest-clock';
import { useSpanText } from './use-span-text';

const props = defineProps<{ contest: ContestListItem }>();
const locale = useLocaleStore();
const spanText = useSpanText();
/** Relative start words move in minutes: a tick a minute is enough. */
const now = useNow(60_000);
const dayChip = computed(() => formatDayMonth(props.contest.startTime, locale.locale));
const timeRange = computed(
  () =>
    `${formatClock(props.contest.startTime, locale.locale)}–${endClockLabel(props.contest, locale.locale)}`,
);
const durationText = computed(() =>
  spanText(
    spanMessage((Date.parse(props.contest.endTime) - Date.parse(props.contest.startTime)) / 1000),
  ),
);
const startsInText = computed(() =>
  formatRelative(props.contest.startTime, now.value, locale.locale),
);
</script>

<template>
  <li
    data-testid="upcoming-contest"
    class="flex flex-wrap items-center gap-4 border-t border-line px-5 py-4 first:border-t-0"
  >
    <span
      data-testid="day-chip"
      class="flex size-16 shrink-0 flex-col items-center justify-center rounded-tile bg-accent-soft text-accent-soft-text"
    >
      <span class="font-display text-2xl leading-none font-bold">{{ dayChip.day }}</span>
      <span class="text-[12px] font-semibold">{{ dayChip.month }}</span>
    </span>
    <div class="min-w-0 flex-1">
      <h3 class="font-display text-lg font-semibold">
        <RouterLink
          :to="{ name: 'contest', params: { key: contest.key } }"
          class="hover:text-accent-text"
          >{{ contest.name }}</RouterLink
        >
      </h3>
      <p v-if="contest.summary" class="text-sm text-muted">{{ contest.summary }}</p>
      <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
        <ContestChips :contest="contest" />
        <span class="font-mono text-[12.5px] text-muted">{{ contest.key }}</span>
      </div>
    </div>
    <div class="text-sm">
      <p class="font-mono font-semibold tabular-nums">{{ timeRange }}</p>
      <p class="text-muted">
        {{ durationText }} · {{ $t('contests.list.startsIn', { relative: startsInText }) }}
      </p>
    </div>
    <p class="text-sm text-muted">
      {{
        $t(
          'contests.participants',
          { count: formatNumber(contest.userCount, locale.locale) },
          contest.userCount,
        )
      }}
    </p>
    <RouterLink
      :to="{ name: 'contest', params: { key: contest.key } }"
      class="inline-flex min-h-11 items-center rounded-pill border border-line px-4 font-semibold hover:bg-surface-hover"
      >{{ $t('contests.list.viewAndRegister')
      }}<span class="sr-only">: {{ contest.name }}</span></RouterLink
    >
  </li>
</template>

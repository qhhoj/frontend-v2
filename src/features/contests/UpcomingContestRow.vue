<script setup lang="ts">
import { computed } from 'vue';
import type { ContestListItem } from '@/api/types/contests';
import { spanMessage } from '@/lib/contest-time';
import { formatNumber } from '@/lib/format';
import { formatClock, formatDayTile, formatRelative } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import ContestCallLink from './ContestCallLink.vue';
import ContestChips from './ContestChips.vue';
import ContestEditLink from './ContestEditLink.vue';
import { listCallToAction } from './contest-action';
import { endClockLabel } from './contest-clock';
import { useSpanText } from './use-span-text';
import ViewerBadge from './ViewerBadge.vue';

/** `withEdit`: an organization's list, where its administrators get a pencil on the contests they edit (P-32). */
const props = defineProps<{ contest: ContestListItem; withEdit?: boolean }>();
const locale = useLocaleStore();
const spanText = useSpanText();
/** Relative start words move in minutes: a tick a minute is enough. */
const now = useNow(60_000);
const call = computed(() => listCallToAction(props.contest, now.value));
const dayTile = computed(() => formatDayTile(props.contest.startTime, locale.locale, now.value));
const timeRange = computed(
  () => `${formatClock(props.contest.startTime)}–${endClockLabel(props.contest)}`,
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
      <span class="font-display text-display leading-none font-bold">{{ dayTile.day }}</span>
      <span class="text-caption font-semibold">{{ dayTile.month }}</span>
      <span v-if="dayTile.year" class="text-tiny leading-none">{{ dayTile.year }}</span>
    </span>
    <!-- On a phone the name takes the rest of the day chip's line (basis 0 let the times share it, one word a line). -->
    <div class="min-w-0 flex-1 basis-[calc(100%-5rem)] sm:basis-0">
      <h3 class="font-display text-subtitle leading-7 font-semibold">
        <RouterLink
          :to="{ name: 'contest', params: { key: contest.key } }"
          class="hover:text-accent-text"
          >{{ contest.name }}</RouterLink
        >
      </h3>
      <p v-if="contest.summary" class="text-sm text-muted">{{ contest.summary }}</p>
      <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
        <ContestChips :contest="contest" with-tags with-code-needed />
        <ViewerBadge :badge-key="call.badgeKey" />
        <span class="font-mono text-caption text-muted">{{ contest.key }}</span>
        <ContestEditLink v-if="withEdit" :contest="contest" />
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
    <ContestCallLink
      :contest-key="contest.key"
      :contest-name="contest.name"
      :label-key="call.labelKey"
      :is-primary="call.isPrimary"
    />
  </li>
</template>

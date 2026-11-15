<script setup lang="ts">
import { computed } from 'vue';
import Card from '@/components/ui/Card.vue';
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

/** `withEdit`: an organization's list, where its administrators get a pencil on the contests they edit. */
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
  <Card
    as="li"
    :to="{ name: 'contest', params: { key: contest.key } }"
    :link-label="contest.name"
    data-testid="upcoming-contest"
    class="flex min-w-0 grow basis-96 flex-col gap-3 p-5"
  >
    <div class="flex min-w-0 items-center gap-4">
      <span
        data-testid="day-chip"
        class="flex size-16 shrink-0 flex-col items-center justify-center rounded-row bg-accent-soft text-accent-soft-text"
      >
        <span class="font-display text-display leading-none font-bold">{{ dayTile.day }}</span>
        <span class="text-caption font-semibold">{{ dayTile.month }}</span>
        <span v-if="dayTile.year" class="text-tiny leading-none">{{ dayTile.year }}</span>
      </span>
      <div class="min-w-0">
        <h3
          :title="contest.name"
          class="truncate font-display text-subtitle leading-7 font-semibold"
        >
          {{ contest.name }}
        </h3>
        <p class="text-sm text-muted">
          <span class="font-mono font-semibold tabular-nums">{{ timeRange }}</span>
          · {{ durationText }}
        </p>
      </div>
    </div>
    <p v-if="contest.summary" class="text-sm text-muted">{{ contest.summary }}</p>
    <div class="flex flex-wrap items-center gap-1.5 [&_a]:relative">
      <ContestChips :contest="contest" with-tags with-code-needed />
      <ViewerBadge :badge-key="call.badgeKey" />
      <template v-if="withEdit">
        <span class="font-mono text-caption text-muted">{{ contest.key }}</span>
        <ContestEditLink :contest="contest" />
      </template>
    </div>
    <div class="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-1">
      <p class="min-w-0 text-sm text-muted">
        <span class="whitespace-nowrap">{{
          $t('contests.list.startsIn', { relative: startsInText })
        }}</span>
        ·
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
    </div>
  </Card>
</template>

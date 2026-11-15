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
    class="flex min-w-0 grow basis-80 flex-col gap-2 p-4"
  >
    <div class="flex min-w-0 items-center gap-3">
      <span
        data-testid="day-chip"
        class="flex size-12 shrink-0 flex-col items-center justify-center rounded-row bg-accent-soft text-accent-soft-text"
      >
        <span class="font-display text-subtitle leading-none font-bold">{{ dayTile.day }}</span>
        <span class="text-tiny font-semibold">{{ dayTile.month }}</span>
      </span>
      <div class="min-w-0">
        <h3
          :title="contest.name"
          class="truncate font-display text-subtitle leading-6 font-semibold"
        >
          {{ contest.name }}
        </h3>
        <p class="truncate text-sm text-muted">
          <span class="font-mono font-semibold tabular-nums">{{ timeRange }}</span>
          · {{ durationText }}
        </p>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-1.5 [&_a]:relative">
      <ContestChips :contest="contest" with-tags with-code-needed />
      <ViewerBadge :badge-key="call.badgeKey" />
      <template v-if="withEdit">
        <span class="font-mono text-caption text-muted">{{ contest.key }}</span>
        <ContestEditLink :contest="contest" />
      </template>
    </div>
    <div class="mt-auto flex items-center justify-between gap-3 pt-1">
      <p class="min-w-0 text-sm text-muted">
        {{ $t('contests.list.startsIn', { relative: startsInText }) }}
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
        compact
        :contest-key="contest.key"
        :contest-name="contest.name"
        :label-key="call.labelKey"
        :is-primary="call.isPrimary"
      />
    </div>
  </Card>
</template>

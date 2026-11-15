<script setup lang="ts">
import ProgressBar from '@/components/ui/ProgressBar.vue';
import { computed } from 'vue';
import type { ContestListItem } from '@/api/types/contests';
import CountdownTimer from '@/components/CountdownTimer.vue';
import { contestProgress } from '@/lib/contest-time';
import { formatNumber } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import ContestCallLink from './ContestCallLink.vue';
import ContestChips from './ContestChips.vue';
import ContestEditLink from './ContestEditLink.vue';
import { listCallToAction } from './contest-action';
import PhasePill from './PhasePill.vue';
import ViewerBadge from './ViewerBadge.vue';

/**
 * One running contest as a full-width row: status, name, chips, time left with a thin progress bar, participants and the
 * action. The whole row is the click target (the name's link is stretched over it); links and the button inside stay above it.
 */
/** `withEdit`: an organization's list, where its administrators get a pencil on the contests they edit. */
const props = defineProps<{ contest: ContestListItem; withEdit?: boolean }>();
const locale = useLocaleStore();
/** The button and the bar move slowly (the time left is CountdownTimer's own clock): a tick every 15 s is enough. */
const now = useNow(15_000);
const call = computed(() => listCallToAction(props.contest, now.value));
const progressPercent = computed(() => Math.round(contestProgress(props.contest, now.value) * 100));
</script>

<template>
  <li
    data-testid="running-contest"
    class="relative grid gap-3 border-t border-line px-4 py-3 first:border-t-0 hover:bg-surface-hover md:grid-cols-[minmax(0,1fr)_14rem_auto] md:items-center md:gap-5 md:px-5"
  >
    <div class="flex min-w-0 flex-col gap-1.5">
      <div class="flex min-w-0 items-center gap-2.5">
        <PhasePill phase="running" />
        <h3 class="min-w-0 truncate font-display text-subtitle leading-7 font-semibold">
          <RouterLink
            :to="{ name: 'contest', params: { key: contest.key } }"
            :title="contest.name"
            class="after:absolute after:inset-0 hover:text-accent-text"
            >{{ contest.name }}</RouterLink
          >
        </h3>
      </div>
      <div class="flex flex-wrap items-center gap-1.5 [&_a]:relative">
        <ContestChips :contest="contest" with-tags with-code-needed />
        <ViewerBadge :badge-key="call.badgeKey" />
        <template v-if="withEdit">
          <span class="font-mono text-caption text-muted">{{ contest.key }}</span>
          <ContestEditLink :contest="contest" />
        </template>
      </div>
    </div>
    <div class="flex flex-col gap-1.5">
      <!-- The bar is slim; the clock is the hero's and the bar's: days and hours from 48 h, HH:MM:SS below. -->
      <i18n-t keypath="contests.list.timeLeft" tag="p" class="text-sm font-semibold tabular-nums">
        <template #span><CountdownTimer :until="contest.endTime" /></template>
      </i18n-t>
      <ProgressBar
        class="h-1!"
        :value="progressPercent"
        :label="$t('home.anon.elapsed', { percent: progressPercent })"
      />
    </div>
    <div class="flex items-center justify-between gap-3 md:justify-end md:gap-5">
      <p class="text-sm whitespace-nowrap text-muted">
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
  </li>
</template>

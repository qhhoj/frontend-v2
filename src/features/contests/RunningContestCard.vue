<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
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
 * One running contest as a block that grows to fill its row: phase and name, chips, then the time left with its thin bar and the
 * contestant count beside the button. The whole block is the link (Card `to`); links and the button inside stay above it.
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
  <Card
    as="li"
    :to="{ name: 'contest', params: { key: contest.key } }"
    :link-label="contest.name"
    data-testid="running-contest"
    class="flex min-w-0 grow basis-80 flex-col gap-2 p-4"
  >
    <div class="flex min-w-0 items-center gap-2.5">
      <PhasePill phase="running" />
      <h3
        :title="contest.name"
        class="min-w-0 truncate font-display text-subtitle leading-7 font-semibold"
      >
        {{ contest.name }}
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
    <div class="mt-auto flex items-end gap-3 pt-1">
      <div class="flex min-w-0 flex-1 flex-col gap-1.5">
        <div class="flex items-baseline justify-between gap-3 text-sm">
          <i18n-t keypath="contests.list.timeLeft" tag="p" class="font-semibold tabular-nums">
            <template #span><CountdownTimer :until="contest.endTime" /></template>
          </i18n-t>
          <p class="whitespace-nowrap text-muted">
            {{
              $t(
                'contests.participants',
                { count: formatNumber(contest.userCount, locale.locale) },
                contest.userCount,
              )
            }}
          </p>
        </div>
        <ProgressBar
          class="h-1!"
          :value="progressPercent"
          :label="$t('home.anon.elapsed', { percent: progressPercent })"
        />
      </div>
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

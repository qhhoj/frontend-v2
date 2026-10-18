<script setup lang="ts">
import ProgressBar from '@/components/ui/ProgressBar.vue';
import { computed } from 'vue';
import type { ContestListItem } from '@/api/types/contests';
import Card from '@/components/ui/Card.vue';
import CountdownTimer from '@/components/CountdownTimer.vue';
import InlineBit from '@/components/InlineBit.vue';
import { contestProgress, spanMessage } from '@/lib/contest-time';
import { formatNumber } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import ContestCallLink from './ContestCallLink.vue';
import ContestChips from './ContestChips.vue';
import ContestEditLink from './ContestEditLink.vue';
import { listCallToAction } from './contest-action';
import { timelineLabels } from './contest-clock';
import PhasePill from './PhasePill.vue';
import { useSpanText } from './use-span-text';
import ViewerBadge from './ViewerBadge.vue';

/** `wide`: the only running contest spans the column, with the time left and the button in a right-hand column (P-26). */
/** `withEdit`: an organization's list, where its administrators get a pencil on the contests they edit (P-32). */
const props = defineProps<{ contest: ContestListItem; wide?: boolean; withEdit?: boolean }>();
const locale = useLocaleStore();
const spanText = useSpanText();
/** The button and the bar move slowly (the time left is CountdownTimer's own clock): a tick every 15 s is enough. */
const now = useNow(15_000);
const call = computed(() => listCallToAction(props.contest, now.value));
const progressPercent = computed(() => Math.round(contestProgress(props.contest, now.value) * 100));
const timeline = computed(() => timelineLabels(props.contest, locale.locale));
const perParticipation = computed(() =>
  props.contest.timeLimit ? spanText(spanMessage(props.contest.timeLimit)) : null,
);
</script>

<template>
  <Card
    as="article"
    data-testid="running-contest"
    :class="[
      'grid gap-3 p-5',
      wide && 'md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-x-10',
    ]"
  >
    <div class="flex min-w-0 flex-col gap-3">
      <div class="flex flex-wrap items-center gap-1.5">
        <PhasePill phase="running" />
        <ContestChips :contest="contest" with-tags with-code-needed />
        <ViewerBadge :badge-key="call.badgeKey" />
      </div>
      <div>
        <h3 class="font-display text-xl font-semibold">
          <RouterLink
            :to="{ name: 'contest', params: { key: contest.key } }"
            class="hover:text-accent-text"
            >{{ contest.name }}</RouterLink
          >
        </h3>
        <p class="flex items-center gap-1 font-mono text-meta text-muted">
          {{ contest.key }}<ContestEditLink v-if="withEdit" :contest="contest" />
        </p>
        <p v-if="contest.summary" class="mt-1 text-muted">{{ contest.summary }}</p>
      </div>
      <!-- As the contest page's bar: the two ends under it, so dated labels never squeeze the bar on a phone. -->
      <div class="flex flex-col gap-1.5">
        <ProgressBar
          :value="progressPercent"
          :label="$t('home.anon.elapsed', { percent: progressPercent })"
        />
        <p class="flex justify-between gap-3 font-mono text-meta text-muted tabular-nums">
          <span>{{ timeline.start }}</span>
          <span>{{ timeline.end }}</span>
        </p>
      </div>
      <p v-if="perParticipation" class="text-sm text-muted">
        {{ $t('contests.list.perParticipation', { span: perParticipation }) }}
      </p>
      <p class="text-sm text-muted">
        {{
          $t(
            'contests.participants',
            { count: formatNumber(contest.userCount, locale.locale) },
            contest.userCount,
          )
        }}
        <span v-if="contest.virtualCount">
          ·
          {{
            $t('contests.virtualExtra', {
              count: formatNumber(contest.virtualCount, locale.locale),
            })
          }}</span
        >
      </p>
    </div>
    <div
      :class="[
        'flex flex-wrap items-center justify-between gap-3',
        wide && 'md:flex-col md:items-end md:justify-end',
      ]"
    >
      <div class="flex items-center gap-2 font-semibold" :class="wide && 'md:text-title'">
        <InlineBit kind="contest" />
        <!-- The hero's and the bar's clock (P-18): days and hours from 48 h, HH:MM:SS below. -->
        <i18n-t keypath="contests.list.timeLeft" tag="p">
          <template #span><CountdownTimer :until="contest.endTime" /></template>
        </i18n-t>
      </div>
      <ContestCallLink
        :contest-key="contest.key"
        :contest-name="contest.name"
        :label-key="call.labelKey"
        :is-primary="call.isPrimary"
      />
    </div>
  </Card>
</template>

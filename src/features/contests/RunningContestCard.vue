<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import ProgressBar from '@/components/ui/ProgressBar.vue';
import { computed } from 'vue';
import type { ContestListItem } from '@/api/types/contests';
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

/**
 * One running contest as a block that grows to fill its row: phase and name, chips, summary, the elapsed bar with its two ends,
 * the time per participation and the contestant counts, then Bit with the time left beside the button. The whole block is the link (Card `to`); links and the button inside stay above it.
 */
/** `withEdit`: an organization's list, where its administrators get a pencil on the contests they edit. */
const props = defineProps<{ contest: ContestListItem; withEdit?: boolean }>();
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
    as="li"
    :to="{ name: 'contest', params: { key: contest.key } }"
    :link-label="contest.name"
    data-testid="running-contest"
    class="flex min-w-0 grow basis-96 flex-col gap-3 p-5"
  >
    <div class="flex min-w-0 items-center gap-2.5">
      <PhasePill phase="running" />
      <h3
        :title="contest.name"
        class="min-w-0 truncate font-display text-section-legacy leading-7 font-semibold"
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
    <p v-if="contest.summary" class="text-muted">{{ contest.summary }}</p>
    <!-- The two ends sit under the bar, so dated labels never squeeze it on a phone. -->
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
    <div class="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-1">
      <div class="flex items-center gap-2 font-semibold">
        <InlineBit kind="contest" />
        <!-- One line, never split mid-phrase: the row wraps the button below instead. -->
        <i18n-t keypath="contests.list.timeLeft" tag="p" class="whitespace-nowrap tabular-nums">
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

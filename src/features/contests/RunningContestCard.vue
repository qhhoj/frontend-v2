<script setup lang="ts">
import { computed } from 'vue';
import type { ContestListItem } from '@/api/types/contests';
import GlassCard from '@/components/GlassCard.vue';
import InlineBit from '@/components/InlineBit.vue';
import { contestProgress, spanMessage } from '@/lib/contest-time';
import { formatClock, formatNumber } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import ContestCallLink from './ContestCallLink.vue';
import ContestChips from './ContestChips.vue';
import { listCallToAction } from './contest-action';
import { endClockLabel } from './contest-clock';
import PhasePill from './PhasePill.vue';
import { useSpanText } from './use-span-text';
import ViewerBadge from './ViewerBadge.vue';

const props = defineProps<{ contest: ContestListItem }>();
const locale = useLocaleStore();
const spanText = useSpanText();
/** Words to the minute: a tick every 15 s is enough. */
const now = useNow(15_000);
const call = computed(() => listCallToAction(props.contest, now.value));
const remaining = computed(() =>
  spanMessage((Date.parse(props.contest.endTime) - now.value) / 1000),
);
const progressPercent = computed(() => Math.round(contestProgress(props.contest, now.value) * 100));
const endLabel = computed(() => endClockLabel(props.contest, locale.locale));
const perParticipation = computed(() =>
  props.contest.timeLimit ? spanText(spanMessage(props.contest.timeLimit)) : null,
);
</script>

<template>
  <GlassCard as="article" data-testid="running-contest" class="flex flex-col gap-3 p-5">
    <div class="flex flex-wrap items-center gap-1.5">
      <PhasePill phase="running" />
      <ViewerBadge :call="call" />
      <ContestChips :contest="contest" />
    </div>
    <div>
      <h3 class="font-display text-xl font-semibold">
        <RouterLink
          :to="{ name: 'contest', params: { key: contest.key } }"
          class="hover:text-accent-text"
          >{{ contest.name }}</RouterLink
        >
      </h3>
      <p class="font-mono text-[13px] text-muted">{{ contest.key }}</p>
      <p v-if="contest.summary" class="mt-1 text-muted">{{ contest.summary }}</p>
    </div>
    <div class="flex items-center gap-3 font-mono text-[13px] tabular-nums">
      <span>{{ formatClock(contest.startTime, locale.locale) }}</span>
      <span aria-hidden="true" class="h-2 flex-1 overflow-hidden rounded-pill bg-surface-hover">
        <span
          class="block h-full rounded-pill bg-accent"
          :style="{ width: `${progressPercent}%` }"
        />
      </span>
      <span>{{ endLabel }}</span>
    </div>
    <div class="flex items-center gap-2 font-semibold">
      <InlineBit kind="contest" />
      <p>{{ $t('contests.list.timeLeft', { span: spanText(remaining) }) }}</p>
    </div>
    <p v-if="perParticipation" class="text-sm text-muted">
      {{ $t('contests.list.perParticipation', { span: perParticipation }) }}
    </p>
    <div class="flex flex-wrap items-center justify-between gap-3">
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
      <ContestCallLink :contest="contest" :call="call" />
    </div>
  </GlassCard>
</template>

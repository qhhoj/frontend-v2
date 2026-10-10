<script setup lang="ts">
import { computed } from 'vue';
import type { SubmissionStats } from '@/api/types/submissions';
import GlassCard from '@/components/GlassCard.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

/** Keep `SubmissionStatsStripSkeleton.vue` in step: same grid, card and text classes. */
const props = defineProps<{ stats: SubmissionStats | undefined }>();
const locale = useLocaleStore();
const NO_VALUE = '—';
const PERCENT = 100;

const hasNoJudge = computed(
  () => props.stats !== undefined && props.stats.judgesTotal > 0 && props.stats.judgesOnline === 0,
);
/** A dash, not `0%` or `NaN`, while nothing was judged today. */
const acceptedPercent = (stats: SubmissionStats) =>
  stats.judgedToday > 0
    ? `${Math.round((stats.acceptedToday / stats.judgedToday) * PERCENT)}%`
    : NO_VALUE;

const tiles = computed(() => {
  const { stats } = props;
  const number = (value: number) => formatNumber(value, locale.locale);
  return [
    {
      id: 'judged',
      labelKey: 'submissions.stats.judgedToday',
      value: stats ? number(stats.judgedToday) : NO_VALUE,
    },
    {
      id: 'accepted',
      labelKey: 'submissions.stats.acceptedToday',
      value: stats ? acceptedPercent(stats) : NO_VALUE,
    },
    {
      id: 'queue',
      labelKey: 'submissions.stats.queue',
      value: stats ? number(stats.queueLength) : NO_VALUE,
    },
    {
      id: 'judges',
      labelKey: 'submissions.stats.judges',
      value: stats ? `${number(stats.judgesOnline)} / ${number(stats.judgesTotal)}` : NO_VALUE,
    },
  ];
});
</script>

<template>
  <div
    data-testid="stats-strip"
    class="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 md:grid-cols-[280px_repeat(3,minmax(0,1fr))] md:gap-5"
  >
    <p v-if="!stats" class="sr-only">{{ $t('submissions.stats.unavailable') }}</p>
    <GlassCard v-for="tile in tiles" :key="tile.id" as="div" class="p-5">
      <dl class="flex flex-col">
        <dt class="order-2 text-[13px] text-muted">{{ $t(tile.labelKey) }}</dt>
        <dd class="order-1 font-mono text-[30px] font-bold tabular-nums">{{ tile.value }}</dd>
        <!-- Said in words as well: colour alone is not a message. -->
        <dd
          v-if="tile.id === 'judges' && hasNoJudge"
          class="order-3 text-[13px] font-semibold text-negative"
        >
          {{ $t('submissions.stats.noJudge') }}
        </dd>
      </dl>
    </GlassCard>
  </div>
</template>

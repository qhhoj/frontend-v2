<script setup lang="ts">
import { computed } from 'vue';
import type { SubmissionStats } from '@/api/types/submissions';
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { NO_VALUE, formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import LiveToggle from './LiveToggle.vue';
import VerdictDistributionBar from './VerdictDistributionBar.vue';

/**
 * Today's numbers in one slim line ("1.284 đã chấm hôm nay · 61% chấp nhận · 2 chờ · 1/1 máy chấm"), the live pill, and
 * the bar of today's verdicts. A phone keeps the queue and the judges only, without the bar. `pending` shows
 * placeholders while the first answer loads; the live pill never waits for it.
 */
const props = defineProps<{
  stats: SubmissionStats | undefined;
  pending?: boolean;
  live: boolean;
}>();
const emit = defineEmits<{ 'update:live': [live: boolean] }>();
const locale = useLocaleStore();
const PERCENT = 100;

const hasNoJudge = computed(
  () => props.stats !== undefined && props.stats.judgesTotal > 0 && props.stats.judgesOnline === 0,
);
/** A dash, not `0%` or `NaN`, while nothing was judged today. */
const acceptedPercent = (stats: SubmissionStats) =>
  stats.judgedToday > 0
    ? `${Math.round((stats.acceptedToday / stats.judgedToday) * PERCENT)}%`
    : NO_VALUE;
/** An older backend does not send the verdicts: the bar is left out, not drawn from the loaded page. */
const verdicts = computed(
  () => (props.stats as Partial<SubmissionStats> | undefined)?.verdictsToday ?? [],
);

/** The figures a phone keeps: is my submission waiting, and is a judge up. */
const PHONE_FIGURES: ReadonlySet<string> = new Set(['queue', 'judges']);
const figures = computed(() => {
  const { stats } = props;
  const number = (value: number) => formatNumber(value, locale.locale);
  return [
    {
      id: 'judged',
      labelKey: 'submissions.stats.judgedToday',
      value: stats && number(stats.judgedToday),
    },
    {
      id: 'accepted',
      labelKey: 'submissions.stats.acceptedToday',
      value: stats && acceptedPercent(stats),
    },
    { id: 'queue', labelKey: 'submissions.stats.queue', value: stats && number(stats.queueLength) },
    {
      id: 'judges',
      labelKey: 'submissions.stats.judges',
      value: stats && `${number(stats.judgesOnline)}/${number(stats.judgesTotal)}`,
    },
  ];
});
</script>

<template>
  <div data-testid="stats-strip" class="flex flex-col gap-3">
    <Card
      as="div"
      class="flex flex-wrap items-center gap-x-5 gap-y-1 py-1 pr-1.5 pl-4 text-meta text-muted"
    >
      <p v-if="!stats && !pending" class="sr-only">{{ $t('submissions.stats.unavailable') }}</p>
      <dl class="m-0 flex flex-wrap items-center gap-x-5 gap-y-1 py-1.5">
        <div
          v-for="figure in figures"
          :key="figure.id"
          class="flex items-baseline gap-1.5"
          :class="{ 'max-sm:hidden': !PHONE_FIGURES.has(figure.id) }"
        >
          <dt class="order-2">{{ $t(figure.labelKey) }}</dt>
          <dd class="order-1 m-0 font-mono text-sm font-bold text-content tabular-nums">
            <SkeletonBlock
              v-if="pending && !stats"
              data-skeleton-region="value"
              text
              class="w-10"
            />
            <template v-else>{{ figure.value ?? NO_VALUE }}</template>
          </dd>
          <!-- Said in words as well: colour alone is not a message. -->
          <dd
            v-if="figure.id === 'judges' && hasNoJudge"
            class="order-3 m-0 font-semibold text-negative"
          >
            {{ $t('submissions.stats.noJudge') }}
          </dd>
        </div>
      </dl>
      <LiveToggle :live="live" class="ml-auto" @update:live="emit('update:live', $event)" />
    </Card>
    <VerdictDistributionBar v-if="verdicts.length" class="max-sm:hidden" :verdicts="verdicts" />
  </div>
</template>

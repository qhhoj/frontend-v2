<script setup lang="ts">
import { computed } from 'vue';
import type { ShareView } from '@/api/types/shares';
import FactLine from '@/components/FactLine.vue';
import Card from '@/components/ui/Card.vue';
import VerdictLabel from '@/components/VerdictLabel.vue';
import VerdictRing from '@/features/submissions/VerdictRing.vue';
import { translate } from '@/i18n';
import { NO_VALUE, formatCaseMemory, formatCaseTime, formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { PARTIAL_CODE, submissionVerdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';

/** The frozen result of a submission share: the ring, the verdict, the score and the "snapshot taken at" note. */
const props = defineProps<{ share: ShareView; copy: NonNullable<ShareView['copy']> }>();
const locale = useLocaleStore();
const SCORE_DIGITS = 2;
const format = (points: number) => formatNumber(points, locale.locale, SCORE_DIGITS, false);

const verdict = computed(() =>
  submissionVerdictOf({
    status: props.copy.status,
    result: props.copy.result,
    points: props.copy.points,
    problem: { points: props.copy.problemPoints },
    casePoints: props.copy.casePoints,
    caseTotal: props.copy.caseTotal,
  }),
);
/** A partially correct score fills the ring by its share of the problem's points. */
const partialShare = computed(() =>
  verdict.value.code === PARTIAL_CODE && props.copy.points !== null && props.copy.problemPoints > 0
    ? props.copy.points / props.copy.problemPoints
    : null,
);
const score = computed(() => (props.copy.points === null ? NO_VALUE : format(props.copy.points)));
const passed = computed(() => {
  const total = props.copy.caseCount ?? props.copy.cases?.length ?? null;
  if (total === null || props.copy.cases === null) return null;
  const done = props.copy.cases.filter((row) => row.status === 'AC').length;
  return translate('share.result.passed', { done, total });
});
const facts = computed(() =>
  [
    passed.value,
    props.copy.judgedAt
      ? translate('share.result.judgedAt', {
          time: formatDate(props.copy.judgedAt, 'datetime', locale.locale),
        })
      : null,
    props.copy.time === null ? null : formatCaseTime(props.copy.time),
    props.copy.memory === null ? null : formatCaseMemory(props.copy.memory),
  ].filter((fact): fact is string => fact !== null),
);
</script>

<template>
  <Card as="div" data-testid="share-result" class="min-w-0 rounded-card p-6">
    <div class="flex items-center gap-5">
      <VerdictRing size="md" :progress="null" :verdict="verdict" :share="partialShare" />
      <div class="min-w-0">
        <p class="text-sm"><VerdictLabel :verdict="verdict" /></p>
        <p class="mt-1 font-mono text-section leading-none font-semibold tabular-nums">
          {{ score }}
          <span class="text-base text-muted"
            >/ {{ format(copy.problemPoints) }} {{ $t('share.result.points') }}</span
          >
        </p>
        <FactLine v-if="facts.length" :facts="facts" class="mt-2 block text-meta text-muted" />
      </div>
    </div>
    <p class="mt-4 mb-0 text-meta text-muted" data-testid="share-snapshot">
      <strong>{{ $t('share.result.snapshot') }}</strong>
      {{
        $t('share.result.snapshotAt', {
          time: formatDate(share.createdAt, 'datetime', locale.locale),
        })
      }}
    </p>
  </Card>
</template>

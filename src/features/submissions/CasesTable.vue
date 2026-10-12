<script setup lang="ts">
import { computed } from 'vue';
import type { CaseStatus, SubmissionBatch, SubmissionCase } from '@/api/types/submissions';
import Card from '@/components/ui/Card.vue';
import VerdictLabel from '@/components/VerdictLabel.vue';
import { translate } from '@/i18n';
import { formatCaseMemory, formatCaseTime, formatNumber } from '@/lib/format';
import { verdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';

/** Keep `CasesTableSkeleton.vue` in step: same card, header cells and row classes. */
const props = defineProps<{
  cases: SubmissionCase[] | null;
  batches: SubmissionBatch[] | null;
  /** B21: the problem's test count, null when the viewer may not see case results. */
  totalCases: number | null;
  /** The row is being graded live: the tests not graded yet are listed as waiting and results arrive by themselves. */
  running: boolean;
  /** The compile log of a compile error. Text only. */
  compileError?: string | null;
}>();

const locale = useLocaleStore();
const NO_VALUE = '—';
const POINT_FRACTION_DIGITS = 2;
const formatPoints = (earned: number, total: number) =>
  [earned, total]
    .map((value) => formatNumber(value, locale.locale, POINT_FRACTION_DIGITS, false))
    .join('/');
const COLUMN_KEYS = ['test', 'result', 'time', 'memory', 'points'] as const;
/** Judge text a case may carry, in reading order. */
const DETAIL_FIELDS = [
  { field: 'feedback', labelKey: 'submission.cases.feedback' },
  { field: 'extendedFeedback', labelKey: 'submission.cases.extendedFeedback' },
  { field: 'output', labelKey: 'submission.cases.output' },
] as const;

interface GradedRow {
  key: string;
  label: string;
  status: CaseStatus;
  time: string;
  memory: string;
  points: string;
  details: { field: string; label: string; text: string }[];
}

const caseVerdict = (status: CaseStatus) => verdictOf({ status: 'D', result: status });
const caseRow = (testCase: SubmissionCase): GradedRow => ({
  key: `case-${testCase.position}`,
  label: String(testCase.position),
  status: testCase.status,
  time: formatCaseTime(testCase.time),
  memory: formatCaseMemory(testCase.memory),
  points: formatPoints(testCase.points, testCase.total),
  details: DETAIL_FIELDS.flatMap(({ field, labelKey }) =>
    testCase[field] ? [{ field, label: translate(labelKey), text: testCase[field] }] : [],
  ),
});
const batchRow = (batch: SubmissionBatch): GradedRow => ({
  key: `batch-${batch.batch}`,
  label: translate('submission.cases.batch', { number: batch.batch }),
  status: batch.status,
  time: NO_VALUE,
  memory: NO_VALUE,
  points: formatPoints(batch.points, batch.total),
  details: [],
});

const gradedRows = computed(() =>
  props.cases ? props.cases.map(caseRow) : (props.batches ?? []).map(batchRow),
);
/** Numbers of the tests after the graded ones; only a row in progress with a known test count has them. */
const pendingNumbers = computed(() => {
  if (!props.running || !props.cases || !props.totalCases) return [];
  const firstPending = props.cases.length + 1;
  return Array.from(
    { length: Math.max(0, props.totalCases - props.cases.length) },
    (_unused, offset) => firstPending + offset,
  );
});
const hasRows = computed(() => gradedRows.value.length > 0 || pendingNumbers.value.length > 0);
const isHidden = computed(
  () => props.cases === null && props.batches === null && !props.compileError,
);
</script>

<template>
  <Card as="div" data-testid="cases-card" class="overflow-hidden rounded-panel">
    <div class="flex flex-wrap items-baseline justify-between gap-x-4 px-6 pt-5 pb-3">
      <h2 class="font-display text-base font-bold">{{ $t('submission.cases.title') }}</h2>
      <span v-if="running" class="text-meta text-muted">{{ $t('submission.liveUpdates') }}</span>
    </div>
    <div v-if="compileError" class="px-6 pb-4 sm:px-8">
      <p class="text-meta text-muted">{{ $t('submission.cases.compileLog') }}</p>
      <pre
        class="mt-1.5 max-h-96 overflow-auto rounded-tile bg-surface-strong p-4 font-mono text-meta leading-relaxed whitespace-pre"
        >{{ compileError }}</pre>
    </div>
    <p v-if="isHidden" class="px-6 pb-6 text-muted sm:px-8">{{ $t('submission.casesHidden') }}</p>
    <div
      v-else-if="hasRows"
      tabindex="0"
      role="region"
      :aria-label="$t('submission.cases.scrollRegion')"
      class="overflow-x-auto focus-visible:-outline-offset-2"
    >
      <table class="w-full min-w-[560px] border-collapse text-sm">
        <caption class="sr-only">
          {{
            $t('submission.cases.title')
          }}
        </caption>
        <thead>
          <tr class="text-left text-meta text-muted">
            <th
              v-for="column in COLUMN_KEYS"
              :key="column"
              scope="col"
              class="px-6 py-3 font-medium"
              :class="{ 'text-right': column !== 'test' && column !== 'result' }"
            >
              {{ $t(`submission.cases.${column}`) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-for="row in gradedRows" :key="row.key">
            <tr :id="row.key" data-testid="case-row" class="scroll-mt-20 border-t border-line">
              <th scope="row" class="px-6 py-3 text-left font-mono font-normal">{{ row.label }}</th>
              <td class="px-6 py-3"><VerdictLabel :verdict="caseVerdict(row.status)" /></td>
              <td class="px-6 py-3 text-right font-mono tabular-nums">{{ row.time }}</td>
              <td class="px-6 py-3 text-right font-mono tabular-nums">{{ row.memory }}</td>
              <td class="px-6 py-3 text-right font-mono tabular-nums">{{ row.points }}</td>
            </tr>
            <tr v-if="row.details.length">
              <td colspan="5" class="px-6 pb-3">
                <div v-for="detail in row.details" :key="detail.field" class="mt-1.5">
                  <p class="text-meta text-muted">{{ detail.label }}</p>
                  <pre
                    class="mt-1 max-h-48 overflow-auto rounded-tile bg-surface-strong p-3 font-mono text-meta whitespace-pre-wrap [overflow-wrap:anywhere]"
                    >{{ detail.text }}</pre>
                </div>
              </td>
            </tr>
          </template>
          <tr
            v-for="number in pendingNumbers"
            :key="`pending-${number}`"
            data-testid="pending-row"
            class="border-t border-line text-muted"
          >
            <th scope="row" class="px-6 py-3 text-left font-mono font-normal">{{ number }}</th>
            <td class="px-6 py-3">{{ $t('submission.cases.pending') }}</td>
            <td class="px-6 py-3 text-right font-mono">{{ NO_VALUE }}</td>
            <td class="px-6 py-3 text-right font-mono">{{ NO_VALUE }}</td>
            <td class="px-6 py-3 text-right font-mono">{{ NO_VALUE }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else-if="!compileError" class="px-6 pb-6 text-muted sm:px-8">
      {{ $t('submission.cases.none') }}
    </p>
  </Card>
</template>

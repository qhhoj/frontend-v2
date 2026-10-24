<script setup lang="ts">
import { computed } from 'vue';
import type { SubmissionBatch, SubmissionCase } from '@/api/types/submissions';
import Card from '@/components/ui/Card.vue';
import VerdictLabel from '@/components/VerdictLabel.vue';
import { translate } from '@/i18n';
import CaseDetails from './CaseDetails.vue';
import { caseDetails, type CaseDetail } from './case-details';
import { formatCaseMemory, formatCaseTime } from '@/lib/format';
import { PARTIAL_CODE, caseVerdictOf, type Verdict } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { formatCasePoints, pendingPositions } from './test-overview';

/**
 * The result card ("Kết quả chấm"): the compile log, one row per test, then the `footer` slot (the subtasks and the total,
 * `TestOverview.vue`). Keep `CasesTableSkeleton.vue` in step: same card, header cells and row classes. Below `sm` the same rows lay out as cards
 * (test, verdict and points, then time and memory), so each test keeps one `#case-<n>` anchor. From `xl` the card sits in the
 * page's narrow rail beside the source, so its cells tighten there (`xl:px-3`) and the table drops its minimum width.
 */
const props = defineProps<{
  cases: SubmissionCase[] | null;
  batches: SubmissionBatch[] | null;
  /** The problem's test count, null when the viewer may not see case results. */
  totalCases: number | null;
  /** The row is being graded live: the tests not graded yet are listed as waiting and results arrive by themselves. */
  running: boolean;
  /** The compile log of a compile error. Text only. */
  compileError?: string | null;
  /** A compile error whose log this viewer may not read (it quotes the code): said instead of "no test results". */
  compileLogHidden?: boolean;
  /** Below `xl` a summary card (`ResultSummaryCard.vue`) stands above the source, so this card is titled as the per-test details there. */
  summarized?: boolean;
}>();

const locale = useLocaleStore();
const NO_VALUE = '—';
const COLUMN_KEYS = ['test', 'result', 'time', 'memory', 'points'] as const;

interface GradedRow {
  key: string;
  label: string;
  verdict: Verdict;
  time: string;
  memory: string;
  points: string;
  details: CaseDetail[];
}

const caseRow = (testCase: SubmissionCase): GradedRow => ({
  key: `case-${testCase.position}`,
  label: String(testCase.position),
  verdict: caseVerdictOf(testCase),
  time: formatCaseTime(testCase.time),
  memory: formatCaseMemory(testCase.memory),
  points: formatCasePoints(testCase.points, testCase.total, locale.locale),
  details: caseDetails(testCase),
});
const batchRow = (batch: SubmissionBatch): GradedRow => ({
  key: `batch-${batch.batch}`,
  label: translate('submission.cases.batch', { number: batch.batch }),
  verdict: caseVerdictOf(batch),
  time: NO_VALUE,
  memory: NO_VALUE,
  points: formatCasePoints(batch.points, batch.total, locale.locale),
  details: [],
});

const gradedRows = computed(() =>
  props.cases ? props.cases.map(caseRow) : (props.batches ?? []).map(batchRow),
);
const pendingNumbers = computed(() =>
  pendingPositions(props.cases, props.totalCases, props.running),
);
/** The phone card grid of a row and where each cell sits in it; from `sm` up they are plain table cells. */
const ROW_CARD =
  'max-sm:grid max-sm:grid-cols-[auto_minmax(0,1fr)_auto] max-sm:items-center max-sm:gap-x-2.5 max-sm:gap-y-0.5 max-sm:px-4 max-sm:py-2.5';
const CELL = 'px-6 py-3 max-sm:p-0 xl:px-3 xl:py-2.5';
const NUMBER_CELL = `${CELL} text-right font-mono tabular-nums`;
const CELL_PLACES = {
  test: 'max-sm:col-start-1 max-sm:row-start-1',
  result: 'max-sm:col-start-2 max-sm:row-start-1',
  time: 'max-sm:col-start-2 max-sm:row-start-2 max-sm:text-left max-sm:text-caption max-sm:text-muted',
  memory: 'max-sm:col-start-3 max-sm:row-start-2 max-sm:text-caption max-sm:text-muted',
  points: 'max-sm:col-start-3 max-sm:row-start-1',
} as const;
const pointsClass = (verdict: Verdict) =>
  verdict.code === PARTIAL_CODE ? 'font-bold text-verdict-partial' : '';
const hasRows = computed(() => gradedRows.value.length > 0 || pendingNumbers.value.length > 0);
const isHidden = computed(
  () => props.cases === null && props.batches === null && !props.compileError,
);
</script>

<template>
  <Card
    id="cases"
    as="div"
    data-testid="cases-card"
    class="scroll-mt-20 overflow-hidden rounded-card"
  >
    <div class="flex flex-wrap items-baseline justify-between gap-x-4 px-4 pt-5 pb-3 sm:px-6">
      <h2 v-if="summarized" class="section-title">
        <span class="xl:hidden">{{ $t('submission.cases.detailsTitle') }}</span>
        <span class="max-xl:hidden">{{ $t('submission.cases.title') }}</span>
      </h2>
      <h2 v-else class="section-title">{{ $t('submission.cases.title') }}</h2>
      <span v-if="running" class="text-meta text-muted">{{ $t('submission.liveUpdates') }}</span>
    </div>
    <div v-if="compileError" class="px-6 pb-4 sm:px-8">
      <p class="text-meta text-muted">{{ $t('submission.cases.compileLog') }}</p>
      <pre
        class="mt-1.5 max-h-96 overflow-auto rounded-cell bg-surface-strong p-4 font-mono text-meta leading-relaxed whitespace-pre"
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
      <table class="w-full border-collapse text-sm max-sm:block sm:min-w-[560px] xl:min-w-0">
        <caption class="sr-only">
          {{
            $t('submission.cases.title')
          }}
        </caption>
        <thead class="max-sm:sr-only">
          <tr class="text-left text-meta text-muted">
            <th
              v-for="column in COLUMN_KEYS"
              :key="column"
              scope="col"
              class="px-6 py-3 font-medium xl:px-3 xl:py-2.5"
              :class="{ 'text-right': column !== 'test' && column !== 'result' }"
            >
              {{ $t(`submission.cases.${column}`) }}
            </th>
          </tr>
        </thead>
        <tbody class="max-sm:block">
          <template v-for="row in gradedRows" :key="row.key">
            <tr
              :id="row.key"
              data-testid="case-row"
              class="scroll-mt-20 border-t border-line"
              :class="ROW_CARD"
            >
              <th
                scope="row"
                class="text-left font-mono font-normal max-sm:text-meta max-sm:text-muted"
                :class="[CELL, CELL_PLACES.test]"
              >
                {{ row.label }}
              </th>
              <td :class="[CELL, CELL_PLACES.result]"><VerdictLabel :verdict="row.verdict" /></td>
              <td :class="[NUMBER_CELL, CELL_PLACES.time]">{{ row.time }}</td>
              <td :class="[NUMBER_CELL, CELL_PLACES.memory]">{{ row.memory }}</td>
              <td :class="[NUMBER_CELL, CELL_PLACES.points, pointsClass(row.verdict)]">
                {{ row.points }}
              </td>
            </tr>
            <tr v-if="row.details.length" class="max-sm:block">
              <td colspan="5" class="px-6 pb-3 max-sm:block max-sm:px-4 xl:px-3">
                <CaseDetails :details="row.details" />
              </td>
            </tr>
          </template>
          <tr
            v-for="number in pendingNumbers"
            :key="`pending-${number}`"
            data-testid="pending-row"
            class="border-t border-line text-muted"
            :class="ROW_CARD"
          >
            <th
              scope="row"
              class="text-left font-mono font-normal"
              :class="[CELL, CELL_PLACES.test]"
            >
              {{ number }}
            </th>
            <td :class="[CELL, CELL_PLACES.result]">{{ $t('submission.cases.pending') }}</td>
            <td :class="[NUMBER_CELL, CELL_PLACES.time]">{{ NO_VALUE }}</td>
            <td :class="[NUMBER_CELL, CELL_PLACES.memory]">{{ NO_VALUE }}</td>
            <td :class="[NUMBER_CELL, CELL_PLACES.points]">{{ NO_VALUE }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else-if="compileLogHidden" class="px-6 pb-6 text-muted sm:px-8">
      {{ $t('submission.cases.compileLogHidden') }}
    </p>
    <p v-else-if="!compileError" class="px-6 pb-6 text-muted sm:px-8">
      {{ $t('submission.cases.none') }}
    </p>
    <slot name="footer" />
  </Card>
</template>

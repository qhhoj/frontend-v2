<script setup lang="ts">
import { computed, ref } from 'vue';
import type { SubmissionBatch, SubmissionCase } from '@/api/types/submissions';
import Card from '@/components/ui/Card.vue';
import VerdictLabel from '@/components/VerdictLabel.vue';
import { translate } from '@/i18n';
import { formatCaseMemory, formatCaseTime } from '@/lib/format';
import { PARTIAL_CODE, caseVerdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import CaseDetails from './CaseDetails.vue';
import { caseDetails } from './case-details';
import {
  PLAIN_ROW_KEY,
  SKIPPED_STATUS,
  buildOverviewRows,
  caseTileClass,
  caseTitle,
  formatCasePoints,
  isFullCase,
  pendingPositions,
  type OverviewRow,
} from './test-overview';

/**
 * The result summary above the source, below `xl` only (from `xl` the full table stands beside the source instead): one
 * numbered tile per test, grouped by subtask, and the tests that lost points opened with their judge text. A tile opens or
 * closes its test inside this card, so the reader never jumps past the code; the full table (`#cases`) keeps times and memory.
 */
const props = defineProps<{
  cases: SubmissionCase[];
  batches: SubmissionBatch[] | null;
  /** The problem's test count, null when unknown. */
  totalCases: number | null;
  /** The grading goes on: the tests not graded yet show as waiting tiles. */
  running: boolean;
}>();

/** At most this many point-losing tests open by themselves; the others are a tap or the table away. */
const OPEN_LOSSES_MAX = 3;
const TILE =
  'flex size-8 items-center justify-center rounded-skeleton font-mono text-caption font-bold touch:size-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';
const OPEN_TILE = 'ring-2 ring-content ring-offset-2 ring-offset-surface-solid';
const locale = useLocaleStore();

const isLoss = (testCase: SubmissionCase) =>
  !isFullCase(testCase) && testCase.status !== SKIPPED_STATUS;
const losses = computed(() => props.cases.filter(isLoss));
const openByDefault = computed(
  () => new Set(losses.value.slice(0, OPEN_LOSSES_MAX).map((testCase) => testCase.position)),
);
/** The tiles the reader tapped, open or closed, over the default. */
const toggled = ref(new Map<number, boolean>());
const isOpen = (position: number) =>
  toggled.value.get(position) ?? openByDefault.value.has(position);
const toggle = (position: number) => toggled.value.set(position, !isOpen(position));
const openCases = computed(() => props.cases.filter((testCase) => isOpen(testCase.position)));
const closedLossCount = computed(
  () => losses.value.filter((testCase) => !isOpen(testCase.position)).length,
);

const testCount = computed(() => props.totalCases ?? props.cases.length);
const passedCount = computed(() => props.cases.filter(isFullCase).length);
const pending = computed(() => pendingPositions(props.cases, props.totalCases, props.running));
/** A subtask's name, the name of the tests outside any subtask beside subtasks, or none for a plain problem's one row. */
function groupLabel(row: OverviewRow): string | null {
  if (row.batch !== null) return translate('submission.overview.subtask', { number: row.batch });
  return row.key === PLAIN_ROW_KEY ? translate('submission.overview.plainTests') : null;
}
/** One tile row per subtask (a plain problem has one unnamed row); waiting tests join a plain row or get their own. */
const groups = computed(() => {
  const graded = buildOverviewRows(props.cases, props.batches).map((row) => ({
    key: row.key,
    label: groupLabel(row),
    cases: row.cases,
    pending: [] as number[],
  }));
  if (pending.value.length === 0) return graded;
  const plain = graded.length === 1 && graded[0]!.label === null ? graded[0] : null;
  if (plain) return [{ ...plain, pending: pending.value }];
  const label = graded.length ? translate('submission.cases.pending') : null;
  return [...graded, { key: 'pending', label, cases: [], pending: pending.value }];
});

const isPartialCase = (testCase: SubmissionCase) => caseVerdictOf(testCase).code === PARTIAL_CODE;
const tileLabel = (testCase: SubmissionCase) => caseTitle(testCase, locale.locale);
const pendingLabel = (position: number) =>
  `${translate('submission.cases.test')} ${position}: ${translate('submission.cases.pending')}`;
const caseFacts = (testCase: SubmissionCase) =>
  [
    formatCaseTime(testCase.time),
    formatCaseMemory(testCase.memory),
    formatCasePoints(testCase.points, testCase.total, locale.locale),
  ].join(' · ');
/** The one line of an all-correct result: nothing to open, so its slowest time and largest memory. Only when every one of
 * the problem's tests passed, so it never says "all" beside a header that counts fewer. */
const allCorrectLine = computed(() => {
  if (props.running || props.cases.length === 0 || passedCount.value < testCount.value) return null;
  return translate('submission.summary.allCorrect', {
    count: props.cases.length,
    time: formatCaseTime(Math.max(...props.cases.map((testCase) => testCase.time))),
    memory: formatCaseMemory(Math.max(...props.cases.map((testCase) => testCase.memory))),
  });
});
const tableLink = computed(() =>
  closedLossCount.value > 0
    ? translate('submission.summary.moreLosses', {
        count: closedLossCount.value,
        total: testCount.value,
      })
    : translate('submission.summary.table', { count: testCount.value }),
);
</script>

<template>
  <Card as="div" data-testid="result-summary" class="overflow-hidden rounded-card">
    <div
      class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 pt-5 pb-3 sm:px-6"
    >
      <h2 class="section-title">{{ $t('submission.cases.title') }}</h2>
      <span v-if="running" class="text-meta text-muted">{{ $t('submission.liveUpdates') }}</span>
      <span v-else class="font-mono text-sm font-semibold tabular-nums">{{
        $t('submission.overview.allPassed', { passed: passedCount, total: testCount })
      }}</span>
    </div>
    <div class="flex flex-col gap-3 px-4 pb-4 sm:px-6">
      <div v-for="group in groups" :key="group.key">
        <p v-if="group.label" class="mb-1.5 text-meta text-muted">{{ group.label }}</p>
        <ol
          class="flex flex-wrap gap-1.5"
          :aria-label="group.label ?? $t('submission.summary.tiles')"
        >
          <li v-for="testCase in group.cases" :key="testCase.position">
            <button
              type="button"
              data-testid="result-tile"
              :aria-expanded="isOpen(testCase.position)"
              aria-controls="result-summary-open"
              :aria-label="tileLabel(testCase)"
              :title="tileLabel(testCase)"
              :class="[
                TILE,
                caseTileClass(testCase),
                isPartialCase(testCase) && 'bg-partial-bg-2 text-verdict-partial',
                testCase.status === SKIPPED_STATUS && 'text-muted',
                isOpen(testCase.position) && OPEN_TILE,
              ]"
              @click="toggle(testCase.position)"
            >
              {{ testCase.position }}
            </button>
          </li>
          <li
            v-for="position in group.pending"
            :key="`pending-${position}`"
            :aria-label="pendingLabel(position)"
            :title="pendingLabel(position)"
            class="border border-dashed border-line-strong text-muted"
            :class="TILE"
          >
            {{ position }}
          </li>
        </ol>
      </div>
    </div>
    <div id="result-summary-open">
      <div
        v-for="testCase in openCases"
        :key="testCase.position"
        data-testid="result-open-case"
        class="border-t border-line px-4 py-3 sm:px-6"
      >
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span class="font-mono font-semibold"
            >{{ $t('submission.cases.test') }} {{ testCase.position }}</span
          >
          <VerdictLabel :verdict="caseVerdictOf(testCase)" />
          <span class="ml-auto font-mono text-meta whitespace-nowrap text-muted tabular-nums">{{
            caseFacts(testCase)
          }}</span>
        </div>
        <CaseDetails :details="caseDetails(testCase)" />
      </div>
    </div>
    <p v-if="allCorrectLine" class="border-t border-line px-4 py-3 text-meta text-muted sm:px-6">
      {{ allCorrectLine }}
    </p>
    <div class="border-t border-line px-4 sm:px-6">
      <a
        href="#cases"
        class="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline"
        >{{ tableLink }}</a
      >
    </div>
  </Card>
</template>

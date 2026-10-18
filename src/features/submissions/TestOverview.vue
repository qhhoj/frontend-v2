<script setup lang="ts">
import { computed } from 'vue';
import { ArrowDownWideNarrow, Info, Sigma } from 'lucide-vue-next';
import type { SubmissionBatch, SubmissionCase } from '@/api/types/submissions';
import ScrollRegion from '@/components/ScrollRegion.vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import {
  BLOCK_TONE_CLASSES,
  PARTIAL_CODE,
  VERDICT_TONE_CLASSES,
  caseVerdictOf,
  verdictOfCode,
} from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import {
  buildOverviewRows,
  earnedTone,
  reasonParts,
  scoreConversion,
  SKIPPED_STATUS,
  type OverviewRow,
} from './test-overview';

/**
 * The foot of the result card (`CasesTable.vue`'s `footer` slot): with subtasks, one row each, one square per test filled by its
 * share of points; then the total with how test points became the score. Squares link to the test's row (`#case-<n>`). Below
 * `sm` the squares hide and each subtask row stacks: name and points, then the verdict and its reason.
 */
const props = defineProps<{
  cases: SubmissionCase[] | null;
  batches: SubmissionBatch[] | null;
  /** The submission's points and the problem's maximum; null while unknown. */
  points: number | null;
  problemPoints: number | null;
  /** The sum of the test (or subtask) points and its maximum, before scaling to the problem's points. */
  casePoints: number;
  caseTotal: number;
  /** The grading goes on: points are not final yet. */
  running: boolean;
  /** The hero leads with contest points, so this total is named as the problem's (M-17). */
  inContest?: boolean;
}>();

const POINT_FRACTION_DIGITS = 2;
const PERCENT = 100;
const NO_VALUE = '—';
const locale = useLocaleStore();
const format = (value: number) => formatNumber(value, locale.locale, POINT_FRACTION_DIGITS, false);
const EARNED_TONE_CLASSES = {
  full: 'text-verdict-ac',
  none: 'text-verdict-wa',
  partial: 'text-verdict-partial',
} as const;
const RULE_ICONS = { sum: Sigma, min: ArrowDownWideNarrow } as const;

const rows = computed(() => buildOverviewRows(props.cases, props.batches));
const hasBatches = computed(() => rows.value.some((row) => row.batch !== null));

const caseLabel = (testCase: SubmissionCase) => translate(caseVerdictOf(testCase).labelKey);
function squareClass(testCase: SubmissionCase): string {
  if (testCase.status === SKIPPED_STATUS) return 'border border-dashed border-line-strong';
  const { code, tone } = caseVerdictOf(testCase);
  return code === PARTIAL_CODE ? 'border border-verdict-partial' : BLOCK_TONE_CLASSES[tone];
}
/** A partial square fills from the bottom by the test's share of its points. */
function squareStyle(testCase: SubmissionCase) {
  if (caseVerdictOf(testCase).code !== PARTIAL_CODE) return undefined;
  const filled = (testCase.points / testCase.total) * PERCENT;
  return {
    background: `linear-gradient(to top, var(--qh-verdict-partial) ${filled}%, var(--qh-partial-bg-3) 0)`,
  };
}
const squareTitle = (testCase: SubmissionCase) =>
  translate('submission.overview.testTitle', {
    number: testCase.position,
    verdict: caseLabel(testCase),
    points: `${format(testCase.points)}/${format(testCase.total)}`,
  });
const rowName = (row: OverviewRow) =>
  row.batch === null
    ? translate('submission.overview.allTests')
    : translate('submission.overview.subtask', { number: row.batch });
const rowChipClass = (row: OverviewRow) => VERDICT_TONE_CLASSES[verdictOfCode(row.verdict).tone];

function rowReason(row: OverviewRow): string {
  return reasonParts(row)
    .map(({ key, values }) =>
      key === 'failed'
        ? translate('submission.overview.failed', {
            ...values,
            verdict: translate(verdictOfCode(row.verdict).labelKey).toLocaleLowerCase(
              locale.locale,
            ),
          })
        : translate(`submission.overview.${key}`, values),
    )
    .join(' · ');
}

const earnedText = (row: OverviewRow) =>
  props.running ? NO_VALUE : `${format(row.earned)} / ${format(row.max)}`;
const conversion = computed(() =>
  props.running
    ? null
    : scoreConversion(props.casePoints, props.caseTotal, props.points, props.problemPoints),
);
const scoreText = computed(() => {
  if (props.running || props.points === null) return NO_VALUE;
  return props.problemPoints === null
    ? format(props.points)
    : `${format(props.points)} / ${format(props.problemPoints)}`;
});
const totalText = computed(() =>
  conversion.value
    ? `${format(props.casePoints)}/${format(props.caseTotal)} → ${scoreText.value}`
    : scoreText.value,
);
const explanation = computed(() => {
  if (!conversion.value || props.points === null || props.problemPoints === null) return null;
  const values = {
    count: props.cases?.length ?? 0,
    parts: rows.value.map((row) => format(row.earned)).join(' + '),
    cases: `${format(props.casePoints)}/${format(props.caseTotal)}`,
    percent: format(conversion.value.share * PERCENT),
    max: format(props.problemPoints),
    points: format(props.points),
  };
  return translate(
    hasBatches.value ? 'submission.overview.explainMin' : 'submission.overview.explainSum',
    values,
  );
});
</script>

<template>
  <div v-if="rows.length" data-testid="test-overview">
    <ScrollRegion v-if="hasBatches" :label="$t('submission.overview.scrollRegion')">
      <table class="w-full border-collapse text-sm max-sm:block sm:min-w-[640px]">
        <caption
          class="border-t border-line px-4 pt-4 pb-2 text-left text-sm font-bold max-sm:block sm:px-6"
        >
          {{
            $t('submission.overview.title')
          }}
        </caption>
        <thead class="max-sm:sr-only">
          <tr class="text-left text-meta text-muted">
            <th scope="col" class="px-4 py-2 font-medium sm:px-6">
              {{ $t('submission.overview.group') }}
            </th>
            <th scope="col" class="px-3 py-2 font-medium max-sm:hidden">
              {{ $t('submission.overview.tests') }}
            </th>
            <th scope="col" class="px-3 py-2 font-medium">
              {{ $t('submission.overview.result') }}
            </th>
            <th scope="col" class="px-4 py-2 text-right font-medium sm:px-6">
              {{ $t('submission.overview.points') }}
            </th>
          </tr>
        </thead>
        <tbody class="max-sm:block">
          <tr
            v-for="row in rows"
            :key="row.key"
            data-testid="overview-row"
            class="border-t border-line max-sm:grid max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:gap-x-3 max-sm:gap-y-2 max-sm:px-4 max-sm:py-3"
          >
            <th scope="row" class="px-4 py-3.5 text-left align-top font-bold max-sm:p-0 sm:px-6">
              <span class="whitespace-nowrap">{{ rowName(row) }}</span>
              <span
                data-testid="overview-rule"
                class="mt-1 flex w-fit items-center gap-1 rounded-pill border border-dashed border-line-strong px-2 text-caption font-normal whitespace-nowrap text-muted"
              >
                <component :is="RULE_ICONS[row.rule]" class="size-3.5" aria-hidden="true" />
                {{
                  $t(
                    row.rule === 'min'
                      ? 'submission.overview.ruleMin'
                      : 'submission.overview.ruleSum',
                  )
                }}
              </span>
            </th>
            <td class="px-3 py-3.5 max-sm:hidden">
              <div class="flex max-w-72 flex-wrap gap-1">
                <a
                  v-for="testCase in row.cases"
                  :key="testCase.position"
                  :href="`#case-${testCase.position}`"
                  :title="squareTitle(testCase)"
                  :aria-label="squareTitle(testCase)"
                  class="size-4 rounded-skeleton focus-visible:outline-2 focus-visible:outline-offset-2"
                  :class="squareClass(testCase)"
                  :style="squareStyle(testCase)"
                />
              </div>
            </td>
            <td class="px-3 py-3.5 max-sm:col-span-2 max-sm:row-start-2 max-sm:p-0">
              <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span
                  class="inline-flex h-6 min-w-10 shrink-0 items-center justify-center rounded-pill px-2 font-mono text-caption font-bold"
                  :class="rowChipClass(row)"
                  >{{ row.verdict }}</span
                >
                <span data-testid="overview-reason" class="text-meta text-muted">{{
                  rowReason(row)
                }}</span>
              </div>
            </td>
            <td
              class="px-4 py-3.5 text-right font-mono font-bold whitespace-nowrap tabular-nums max-sm:col-start-2 max-sm:row-start-1 max-sm:p-0 sm:px-6"
              :class="running ? '' : EARNED_TONE_CLASSES[earnedTone(row.earned, row.max)]"
            >
              {{ earnedText(row) }}
            </td>
          </tr>
        </tbody>
      </table>
    </ScrollRegion>
    <div
      class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t-2 border-content px-4 py-4 sm:px-6"
    >
      <span class="font-bold">{{
        $t(inContest ? 'submission.overview.problemTotal' : 'submission.overview.total')
      }}</span>
      <span
        data-testid="overview-total"
        class="font-mono text-title font-bold whitespace-nowrap tabular-nums"
        >{{ totalText }}</span
      >
    </div>
    <p
      v-if="explanation"
      data-testid="overview-explanation"
      class="mx-4 mb-4 flex items-start gap-2.5 rounded-row bg-surface-strong px-4 py-2.5 text-meta sm:mx-6"
    >
      <Info class="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
      <span
        >{{ explanation }}
        <span class="text-muted">{{ $t('submission.overview.rounding') }}</span></span
      >
    </p>
  </div>
</template>

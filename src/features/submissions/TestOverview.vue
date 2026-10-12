<script setup lang="ts">
import { computed } from 'vue';
import type { CaseStatus, SubmissionBatch, SubmissionCase } from '@/api/types/submissions';
import GlassCard from '@/components/GlassCard.vue';
import ScrollRegion from '@/components/ScrollRegion.vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { BLOCK_TONE_CLASSES, VERDICT_TONE_CLASSES, verdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { buildOverviewRows, earnedTone, SKIPPED_STATUS, type OverviewRow } from './test-overview';

/** The score explained: one row per subtask, one square per test. Squares link to the test's row in `CasesTable.vue` (`#case-<n>`). */
const props = defineProps<{
  cases: SubmissionCase[] | null;
  batches: SubmissionBatch[] | null;
  /** The submission's points and the problem's maximum; null while unknown. */
  points: number | null;
  problemPoints: number | null;
  /** The grading goes on: points are not final yet. */
  running: boolean;
}>();

const POINT_FRACTION_DIGITS = 2;
const NO_VALUE = '—';
const locale = useLocaleStore();
const format = (value: number) => formatNumber(value, locale.locale, POINT_FRACTION_DIGITS, false);
const EARNED_TONE_CLASSES = {
  full: 'text-verdict-ac',
  none: 'text-verdict-wa',
  partial: 'text-content',
} as const;

const rows = computed(() => buildOverviewRows(props.cases, props.batches));
const hasBatches = computed(() => rows.value.some((row) => row.batch !== null));

const statusVerdict = (status: CaseStatus) => verdictOf({ status: 'D', result: status });
const verdictLabel = (status: CaseStatus) => translate(statusVerdict(status).labelKey);
const squareClass = (status: CaseStatus) =>
  status === SKIPPED_STATUS
    ? 'border border-dashed border-line-strong'
    : BLOCK_TONE_CLASSES[statusVerdict(status).tone];
const squareTitle = (testCase: SubmissionCase) =>
  translate('submission.overview.testTitle', {
    number: testCase.position,
    verdict: verdictLabel(testCase.status),
  });
const rowName = (row: OverviewRow) =>
  row.batch === null
    ? translate('submission.overview.allTests')
    : translate('submission.overview.subtask', { number: row.batch });

function rowReason(row: OverviewRow): string {
  if (row.failedPosition === null && row.skippedCount === 0)
    return translate('submission.overview.allPassed', {
      passed: row.passedCount,
      total: row.cases.length,
    });
  const parts: string[] = [];
  if (row.failedPosition !== null)
    parts.push(
      translate('submission.overview.failed', {
        number: row.failedPosition,
        verdict: verdictLabel(row.verdict).toLocaleLowerCase(locale.locale),
      }),
    );
  if (row.skippedCount > 0)
    parts.push(translate('submission.overview.skipped', { count: row.skippedCount }));
  return parts.join(', ');
}

const earnedText = (row: OverviewRow) =>
  props.running ? NO_VALUE : `${format(row.earned)} / ${format(row.max)}`;
const totalText = computed(() => {
  if (props.running || props.points === null) return NO_VALUE;
  return props.problemPoints === null
    ? format(props.points)
    : `${format(props.points)} / ${format(props.problemPoints)}`;
});
</script>

<template>
  <GlassCard
    v-if="rows.length"
    as="div"
    data-testid="test-overview"
    class="overflow-hidden rounded-panel"
  >
    <ScrollRegion :label="$t('submission.overview.scrollRegion')">
      <table class="w-full min-w-[640px] border-collapse text-sm">
        <caption class="px-6 pt-5 pb-3 text-left font-display text-base font-bold">
          {{
            $t('submission.overview.title')
          }}
        </caption>
        <thead>
          <tr class="text-left text-xs font-bold tracking-wide text-muted uppercase">
            <th scope="col" class="px-6 py-2">{{ $t('submission.overview.group') }}</th>
            <th scope="col" class="px-3 py-2">{{ $t('submission.overview.tests') }}</th>
            <th scope="col" class="px-3 py-2">{{ $t('submission.overview.result') }}</th>
            <th scope="col" class="px-6 py-2 text-right">{{ $t('submission.overview.points') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.key"
            data-testid="overview-row"
            class="border-t border-line"
          >
            <th scope="row" class="px-6 py-3.5 text-left font-bold whitespace-nowrap">
              {{ rowName(row) }}
            </th>
            <td class="px-3 py-3.5">
              <div class="flex max-w-72 flex-wrap gap-1">
                <a
                  v-for="testCase in row.cases"
                  :key="testCase.position"
                  :href="`#case-${testCase.position}`"
                  :title="squareTitle(testCase)"
                  :aria-label="squareTitle(testCase)"
                  class="size-4 rounded-skeleton focus-visible:outline-2 focus-visible:outline-offset-2"
                  :class="squareClass(testCase.status)"
                />
              </div>
            </td>
            <td class="px-3 py-3.5">
              <div class="flex items-center gap-2.5">
                <span
                  class="inline-flex h-6 min-w-10 shrink-0 items-center justify-center rounded-tile px-2 font-mono text-xs font-bold"
                  :class="VERDICT_TONE_CLASSES[statusVerdict(row.verdict).tone]"
                  >{{ row.verdict }}</span
                >
                <span class="text-[13px] text-muted">{{ rowReason(row) }}</span>
              </div>
            </td>
            <td
              class="px-6 py-3.5 text-right font-mono font-bold whitespace-nowrap tabular-nums"
              :class="running ? '' : EARNED_TONE_CLASSES[earnedTone(row.earned, row.max)]"
            >
              {{ earnedText(row) }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-content">
            <th scope="row" colspan="3" class="px-6 py-4 text-left font-bold">
              {{ $t('submission.overview.total') }}
              <span v-if="hasBatches" class="font-normal text-muted">
                · {{ $t('submission.overview.rule') }}
              </span>
            </th>
            <td
              class="px-6 py-4 text-right font-mono text-lg font-bold whitespace-nowrap tabular-nums"
            >
              {{ totalText }}
            </td>
          </tr>
        </tfoot>
      </table>
    </ScrollRegion>
  </GlassCard>
</template>

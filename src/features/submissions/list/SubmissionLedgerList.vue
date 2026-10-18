<script setup lang="ts">
import type { SubmissionListItem } from '@/api/types/submissions';
import Card from '@/components/ui/Card.vue';
import { translate } from '@/i18n';
import { computed } from 'vue';
import { formatClock, formatDate } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { VERDICT_TONE_CLASSES, submissionVerdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { useRowOpen } from '../row-open';
import { NO_VALUE, isFinished } from '../submission-row';
import { stripCounts } from './test-strip';

/**
 * Ledger rows (P-21): the problem's letter, its name, then who (`showUser`), when and how many tests passed, with the
 * verdict code on the right. One card, one line pair per submission, so the newest result is in sight on a phone.
 */
const props = defineProps<{
  submissions: SubmissionListItem[];
  highlightIds: ReadonlySet<string>;
  problemLabels: Record<string, string>;
  showUser: boolean;
}>();
const locale = useLocaleStore();
const { openRow, openRowInTab } = useRowOpen();
/** A tab left open past midnight dates yesterday's rows: the day is checked once a minute. */
const now = useNow(60_000);
const isToday = (date: string) =>
  new Date(date).toDateString() === new Date(now.value).toDateString();
/** The clock for today's rows, the short date otherwise (the hover title carries the whole datetime). */
const whenOf = (date: string) =>
  isToday(date) ? formatClock(date) : formatDate(date, 'short', locale.locale, { now: now.value });
/** "0/2 test đúng" once judged, "đang chấm" before; null when the tests are hidden from this viewer. */
function progressOf(row: SubmissionListItem): string | null {
  if (!isFinished(row)) return translate('submissions.strip.grading');
  if (!row.testSummary) return null;
  const { passed, outOf } = stripCounts(row.testSummary);
  const key =
    row.testSummary.unit === 'batch' ? 'submissions.strip.passedBatch' : 'submissions.strip.passed';
  return translate(key, { passed, outOf });
}
/** Each row's verdict, progress and spoken label, worked out once per list change. */
const views = computed(
  () =>
    new Map(
      props.submissions.map((row) => {
        const verdict = submissionVerdictOf(row);
        const label = translate('submissions.rowLabel', {
          id: row.id,
          user: row.user?.username ?? NO_VALUE,
          problem: row.problem?.name ?? NO_VALUE,
          verdict: translate(verdict.labelKey),
        });
        return [row.id, { verdict, label, progress: progressOf(row) }];
      }),
    ),
);
</script>

<template>
  <Card
    as="ul"
    data-testid="submission-ledger"
    class="m-0 list-none overflow-hidden p-0"
    :aria-label="$t('submissions.listName')"
  >
    <li
      v-for="row in submissions"
      :key="row.id"
      :data-id="row.id"
      class="grid cursor-pointer grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 border-t border-line px-4 py-3 first:border-t-0 hover:bg-surface-hover md:px-5"
      :class="{ 'row-added': highlightIds.has(row.id) }"
      @click="openRow($event, row.id)"
      @auxclick="openRowInTab($event, row.id)"
    >
      <span aria-hidden="true" class="font-display text-lg font-bold">{{
        row.problem ? (problemLabels[row.problem.code] ?? '') : ''
      }}</span>
      <div class="min-w-0">
        <p class="truncate font-semibold">{{ row.problem?.name ?? NO_VALUE }}</p>
        <p class="truncate font-mono text-meta text-muted tabular-nums">
          <template v-if="showUser && row.user">{{ row.user.username }} · </template>
          <time :datetime="row.date" :title="formatDate(row.date, 'datetime', locale.locale)">{{
            whenOf(row.date)
          }}</time>
          <template v-if="views.get(row.id)!.progress">
            · {{ views.get(row.id)!.progress }}</template
          >
        </p>
      </div>
      <RouterLink
        :to="{ name: 'submission', params: { id: row.id } }"
        :aria-label="views.get(row.id)!.label"
        class="inline-flex min-h-8 items-center rounded-pill px-2.5 font-mono text-xs font-bold pointer-coarse:min-h-11"
        :class="VERDICT_TONE_CLASSES[views.get(row.id)!.verdict.tone]"
        >{{ views.get(row.id)!.verdict.code }}</RouterLink
      >
    </li>
  </Card>
</template>

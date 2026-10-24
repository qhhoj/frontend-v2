import { useQueryClient } from '@tanstack/vue-query';
import { computed, watch } from 'vue';
import type { Ref } from 'vue';
import { FINISHED_STATUSES, IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import { useLiveSubmission } from '@/features/submissions/use-live-submission';
import { translate } from '@/i18n';
import { formatNumber, scoreBelowFull } from '@/lib/format';
import { ringProgress } from '@/lib/grading';
import { PARTIAL_CODE, submissionVerdictOf, verdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { firstFailedTest, scoreOnScale } from './submit-result';
import type { ScoreScale } from './submit-result';

/** Site points keep up to two decimals. */
const SITE_DIGITS = 2;

/**
 * The viewer's latest submission on this problem, followed live for as long as the page lives (closing the dock
 * does not stop it), and what the result strip says about it: "0 / 1000 · WA test 1". `scale` is what the score is out of:
 * the problem's points, or the contest's inside the viewer's contest.
 */
export function useSubmitResult(submissionId: Ref<string | null>, scale: Ref<ScoreScale>) {
  const locale = useLocaleStore();
  const queryClient = useQueryClient();
  const id = computed(() => submissionId.value ?? '');
  const { submission, live } = useLiveSubmission(id);
  const row = computed(() => (id.value ? submission.data.value : undefined));

  const isFinished = computed(() =>
    row.value ? FINISHED_STATUSES.includes(row.value.status) : false,
  );
  /** As on the submission page: the stream leads while the grading goes on, then the stored row. */
  const verdict = computed(() => {
    const streamStatus = live.status;
    if (streamStatus !== null && IN_PROGRESS_STATUSES.includes(streamStatus))
      return verdictOf({ status: streamStatus, result: null });
    return row.value ? submissionVerdictOf(row.value) : verdictOf({ status: 'QU', result: null });
  });
  const progress = computed(() =>
    row.value && !isFinished.value ? ringProgress(row.value) : null,
  );
  const partialShare = computed(() => {
    const max = scale.value.problemPoints;
    return verdict.value.code === PARTIAL_CODE && row.value?.points != null && max > 0
      ? row.value.points / max
      : null;
  });
  /** "99.99 / 100": on the site scale a score short of the maximum never reads as it; contest points follow the contest's precision. */
  const scoreText = (score: number, max: number) => {
    const precision = scale.value.contest?.precision;
    if (precision !== undefined)
      return `${formatNumber(score, locale.locale, precision)} / ${formatNumber(max, locale.locale, precision)}`;
    const format = (points: number) => formatNumber(points, locale.locale, SITE_DIGITS, false);
    return `${format(scoreBelowFull(score, max, SITE_DIGITS))} / ${format(max)}`;
  };
  /** While grading: "Đang chấm · test 4". Finished: the score and where it failed ("0 / 1000 · lỗi ở test 1"); the ring
   *  carries the verdict code, so the text never repeats it (M-12). */
  const text = computed(() => {
    if (!row.value || !isFinished.value) {
      const test = live.currentTestcase || row.value?.currentTestcase || 0;
      const label = translate(verdict.value.labelKey);
      return test ? translate('submit.result.atTest', { verdict: label, test }) : label;
    }
    const failed = firstFailedTest(row.value.cases);
    const parts: string[] = [];
    if (row.value.points !== null) {
      const { points, contest } = row.value;
      const { score, max } = scoreOnScale({ points, contest }, scale.value);
      parts.push(scoreText(score, max));
    }
    if (failed) parts.push(translate('submit.result.failedAt', { test: failed }));
    return parts.length ? parts.join(' · ') : translate(verdict.value.labelKey);
  });
  /** What a screen reader hears once the grading ends: the verdict's name, then the text. */
  const announcement = computed(() => {
    if (!isFinished.value) return '';
    const label = translate(verdict.value.labelKey);
    return text.value === label ? label : `${label} · ${text.value}`;
  });

  // A finished grading can change the viewer's status on the problem and its solver count.
  watch(isFinished, (finished, before) => {
    if (finished && before === false)
      void queryClient.invalidateQueries({ queryKey: ['problems', 'detail'] });
  });

  return {
    isEmpty: computed(() => !row.value || row.value.status === 'PD'),
    isFinished,
    verdict,
    progress,
    partialShare,
    text,
    announcement,
  };
}
export type SubmitResult = ReturnType<typeof useSubmitResult>;

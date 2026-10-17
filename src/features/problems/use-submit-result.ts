import { useQueryClient } from '@tanstack/vue-query';
import { computed, watch } from 'vue';
import type { Ref } from 'vue';
import { FINISHED_STATUSES, IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import { useLiveSubmission } from '@/features/submissions/use-live-submission';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { ringProgress } from '@/lib/grading';
import { PARTIAL_CODE, submissionVerdictOf, verdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { firstFailedTest, scoreOnScale } from './submit-result';
import type { ScoreScale } from './submit-result';

/**
 * Q-01 B: the viewer's latest submission on this problem, followed live for as long as the page lives (closing the dock
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
  const format = (points: number) => {
    const precision = scale.value.contest?.precision;
    return precision === undefined
      ? formatNumber(points, locale.locale, 2, false)
      : formatNumber(points, locale.locale, precision);
  };
  const text = computed(() => {
    if (!row.value || !isFinished.value) {
      const test = live.currentTestcase || row.value?.currentTestcase || 0;
      const label = translate(verdict.value.labelKey);
      return test ? translate('submit.result.atTest', { verdict: label, test }) : label;
    }
    const failed = firstFailedTest(row.value.cases);
    const code = failed
      ? translate('submit.result.atTest', { verdict: verdict.value.code, test: failed })
      : verdict.value.code;
    if (row.value.points === null) return code;
    const { score, max } = scoreOnScale(row.value.points, scale.value);
    return `${format(score)} / ${format(max)} · ${code}`;
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
  };
}
export type SubmitResult = ReturnType<typeof useSubmitResult>;

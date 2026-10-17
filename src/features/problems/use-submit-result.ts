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
import { firstFailedTest } from './submit-result';

/**
 * Q-01 B: the viewer's latest submission on this problem, followed live for as long as the page lives (closing the dock
 * does not stop it), and what the result strip says about it: "0 / 1000 · WA test 1". `maxPoints` is what the score is
 * out of.
 */
export function useSubmitResult(submissionId: Ref<string | null>, maxPoints: Ref<number>) {
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
  const partialShare = computed(() =>
    verdict.value.code === PARTIAL_CODE && row.value?.points != null && maxPoints.value > 0
      ? row.value.points / maxPoints.value
      : null,
  );
  const format = (points: number) => formatNumber(points, locale.locale, 2, false);
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
    return row.value.points === null
      ? code
      : `${format(row.value.points)} / ${format(maxPoints.value)} · ${code}`;
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

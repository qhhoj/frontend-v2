import { computed } from 'vue';
import type { Ref } from 'vue';
import type { SubmissionDetail, SubmissionStatus } from '@/api/types/submissions';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import type { SubmissionInContest } from './submission-contest';

/** Judged to a score: an internal error or an abort has none, so the problem's own line stays. */
const SCORED_STATUSES: readonly SubmissionStatus[] = ['D', 'CE'];

/**
 * The hero's contest score (Q-10 A): `35` of `100` contest points, at the contest's precision, once the submission is
 * judged; null otherwise (the problem's own score leads then).
 */
export function useContestScore(
  row: Ref<SubmissionDetail | undefined>,
  inContest: Ref<SubmissionInContest | null>,
): Ref<{ points: string; max: string } | null> {
  const locale = useLocaleStore();
  return computed(() => {
    const submission = row.value;
    const points = inContest.value?.points ?? null;
    if (!submission || !inContest.value || points === null) return null;
    if (!SCORED_STATUSES.includes(submission.status)) return null;
    const { contest, problem } = inContest.value;
    const format = (value: number) =>
      formatNumber(value, locale.locale, contest.pointsPrecision, false);
    return { points: format(points), max: format(problem.points) };
  });
}

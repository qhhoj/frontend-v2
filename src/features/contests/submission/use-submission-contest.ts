import { computed } from 'vue';
import type { Ref } from 'vue';
import type { SubmissionDetail } from '@/api/types/submissions';
import { useCurrentContest } from '../bar/use-current-contest';
import { useContestQuery } from '../contests.queries';
import { isDuringRun, nextProblem } from './submission-contest';
import type { SubmissionInContest } from './submission-contest';

/**
 * The contest a submission was made in (P-14 B), from the detail's `contest` and the contest's problem list; null
 * outside a contest or when the contest's problems are not readable. The run minute is the API's (the submitter's own
 * submission within its run); the next problem comes only for the viewer's own submission in their running run.
 */
export function useSubmissionContest(
  row: Ref<SubmissionDetail | undefined>,
  isOwn: Ref<boolean>,
): Ref<SubmissionInContest | null> {
  const key = computed(() => row.value?.contest?.key ?? '');
  const { data: contest } = useContestQuery(key, () => key.value !== '');
  const { current } = useCurrentContest(() => isOwn.value);
  return computed(() => {
    const submission = row.value;
    const code = submission?.problem?.code;
    const problems = contest.value?.key === key.value ? contest.value.problems : null;
    if (!submission?.contest || !code || !contest.value || !problems) return null;
    const problem = problems.find((candidate) => candidate.code === code);
    if (!problem) return null;
    const run = current.value?.participation;
    const isInRun =
      isOwn.value &&
      current.value?.contest.key === key.value &&
      run !== undefined &&
      isDuringRun(submission.date, run);
    return {
      contest: contest.value,
      problem,
      points: submission.contest.points,
      next: isInRun ? nextProblem(problems, code) : null,
      minute: submission.contest.minute,
    };
  });
}

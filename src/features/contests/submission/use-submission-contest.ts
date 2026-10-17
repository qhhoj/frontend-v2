import { computed } from 'vue';
import type { Ref } from 'vue';
import type { SubmissionDetail } from '@/api/types/submissions';
import { useCurrentContest } from '../bar/use-current-contest';
import { useContestQuery } from '../contests.queries';
import { isDuringRun, nextProblem } from './submission-contest';
import type { SubmissionInContest } from './submission-contest';

/**
 * The viewer's own submission made in the contest they are taking part in now (P-14 B), or null. The detail does not
 * name its contest: the running participation, the submission's time inside it and the contest's problem list decide.
 * The contest's detail is the one the problem page and the bar already read.
 */
export function useSubmissionContest(
  row: Ref<SubmissionDetail | undefined>,
  isOwn: Ref<boolean>,
): Ref<SubmissionInContest | null> {
  const { current } = useCurrentContest(() => isOwn.value);
  const key = computed(() => current.value?.contest.key ?? '');
  const { data: contest } = useContestQuery(key, () => key.value !== '');
  return computed(() => {
    const submission = row.value;
    const run = current.value?.participation;
    const code = submission?.problem?.code;
    if (!isOwn.value || !submission || !run || !code || !contest.value?.problems) return null;
    if (contest.value.key !== key.value || !isDuringRun(submission.date, run)) return null;
    const problems = contest.value.problems;
    const problem = problems.find((candidate) => candidate.code === code);
    if (!problem) return null;
    return {
      contest: contest.value,
      problem,
      next: nextProblem(problems, code),
      minute: Math.floor((Date.parse(submission.date) - Date.parse(run.realStart)) / 60_000),
    };
  });
}

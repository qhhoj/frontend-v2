import type { SubmissionListItem } from '@/api/types/submissions';

type Problem = NonNullable<SubmissionListItem['problem']>;

/**
 * The problem "Tiếp tục" opens: the one of the newest submission that was not accepted, else of the newest one.
 * Submissions come newest first. A deleted problem (`isDeleted`, the only flag the type has: no hidden or private one) is skipped. The list is the recent page, so an older unsolved problem is not found.
 */
export function continueProblem(submissions: readonly SubmissionListItem[]): Problem | null {
  const withProblem = submissions.filter((item) => item.problem && !item.problem.isDeleted);
  const target = withProblem.find((item) => item.result !== 'AC') ?? withProblem[0];
  return target?.problem ?? null;
}

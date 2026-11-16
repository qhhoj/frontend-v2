import type { SubmissionListItem } from '@/api/types/submissions';

/**
 * The submission "Làm tiếp" opens from: the newest one whose problem has no AC in the list, else the newest one.
 * Submissions come newest first. A deleted problem (`isDeleted`, the only flag the type has: no hidden or private one) is skipped. The list is the recent page, so an older unsolved problem is not found.
 */
export function continueTarget(
  submissions: readonly SubmissionListItem[],
): SubmissionListItem | null {
  const withProblem = submissions.filter((item) => item.problem && !item.problem.isDeleted);
  const solved = new Set(
    withProblem.filter((item) => item.result === 'AC').map((item) => item.problem?.code),
  );
  return withProblem.find((item) => !solved.has(item.problem?.code)) ?? withProblem[0] ?? null;
}

export interface FirstFailure {
  verdict: string;
  /** The test number (unit `case`) or the batch number (unit `batch`), from 1. */
  position: number;
  unit: 'case' | 'batch';
}

/** The first test that was not accepted, from the list's `testSummary`; null when it is missing or every listed test passed. */
export function firstFailure(submission: SubmissionListItem): FirstFailure | null {
  const summary = submission.testSummary;
  const index = summary?.statuses.findIndex((status) => status !== 'AC') ?? -1;
  if (!summary || index < 0) return null;
  return {
    verdict: summary.statuses[index]!,
    position: summary.unit === 'batch' ? (summary.batches[index] ?? index + 1) : index + 1,
    unit: summary.unit,
  };
}

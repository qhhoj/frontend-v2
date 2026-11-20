import type { SubmissionListItem } from '@/api/types/submissions';
import { submissionVerdictOf } from '@/lib/verdicts';

/**
 * "Làm tiếp": the problems of the viewer's recent submissions that are not solved yet, most recently tried first, each
 * as its best-scoring submission (the newest one on a tie). A problem is solved when the list holds a full AC of it or
 * `solvedCodes` (the catalogue's status) names it. A deleted problem is skipped. The list is the recent page, so a
 * problem last tried long ago is not found.
 */
export interface UnfinishedProblem {
  code: string;
  name: string;
  /** The best-scoring recent submission of the problem: its verdict is the row's lamp, its score the row's score. */
  submission: SubmissionListItem;
}

export function unfinishedProblems(
  submissions: readonly SubmissionListItem[],
  solvedCodes: ReadonlySet<string>,
  limit: number,
): UnfinishedProblem[] {
  const best = new Map<string, UnfinishedProblem>();
  const solved = new Set(solvedCodes);
  for (const item of submissions) {
    if (!item.problem || item.problem.isDeleted) continue;
    const { code, name } = item.problem;
    if (submissionVerdictOf(item).code === 'AC') solved.add(code);
    const kept = best.get(code);
    if (!kept || (item.points ?? -1) > (kept.submission.points ?? -1))
      best.set(code, { code, name, submission: item });
  }
  return [...best.values()].filter((problem) => !solved.has(problem.code)).slice(0, limit);
}

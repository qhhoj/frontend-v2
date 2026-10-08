import type { ContestProblem, RankingProblem } from '@/api/types/contests';
import { rankingCell } from '@/lib/ranking-cells';
import type { RankingCellView, RankingContext } from '@/lib/ranking-cells';

export type OwnResultView =
  | { kind: 'cell'; cell: RankingCellView }
  | { kind: 'pending' }
  | { kind: 'attempted'; attempts: number }
  | { kind: 'untouched' };

/**
 * The ranking's view of the viewer's own result on a problem. No first-solve star: the detail does not
 * know who solved first, so the cell is drawn with no first solve.
 */
export function ownResultView(problem: ContestProblem, context: RankingContext): OwnResultView {
  const result = problem.viewerResult;
  if (!result) return { kind: 'untouched' };
  if (result.cell) {
    const rankingProblem: RankingProblem = {
      ...problem,
      firstSolve: null,
      acceptedCount: problem.solverCount ?? 0,
    };
    const cell = rankingCell(result.cell, rankingProblem, '', context);
    if (cell.kind !== 'empty') return { kind: 'cell', cell };
  }
  if (result.hasPendingSubmission) return { kind: 'pending' };
  return result.attempts > 0
    ? { kind: 'attempted', attempts: result.attempts }
    : { kind: 'untouched' };
}

/** Attempts left under a cap, never below zero. */
export const attemptsLeftUnderCap = (maxSubmissions: number, attempts: number): number =>
  Math.max(0, maxSubmissions - attempts);

/** How many problems the viewer solved out of the contest's problems. */
export const solvedSummary = (problems: ContestProblem[]) => ({
  solved: problems.filter((problem) => problem.viewerResult?.isSolved).length,
  total: problems.length,
});

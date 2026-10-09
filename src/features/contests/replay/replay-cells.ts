import type { ProblemCell, RankingProblem } from '@/api/types/contests';
import type { ReplayProblem } from '@/api/types/replay';
import { rankingCell } from '@/lib/ranking-cells';
import type { RankingContext } from '@/lib/ranking-cells';

/** A replay problem read by the ranking's cell rules, which also want the board's first solve and count (unknown here). */
export const asRankingProblem = (problem: ReplayProblem): RankingProblem => ({
  ...problem,
  firstSolve: null,
  acceptedCount: 0,
});

/** Full points for the format (the ranking's own cell rules decide). */
export function isSolvedCell(
  cell: ProblemCell | undefined,
  problem: ReplayProblem,
  context: RankingContext,
): boolean {
  const { kind } = rankingCell(cell, asRankingProblem(problem), '', context);
  return kind === 'solved' || kind === 'first-solve';
}

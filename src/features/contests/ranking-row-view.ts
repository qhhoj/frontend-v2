import type { RouteLocationRaw } from 'vue-router';
import type { RankingProblem, RankingRow } from '@/api/types/contests';
import { formatCumtime, rankingCell, totalScoreText } from '@/lib/ranking-cells';
import type { RankingCellView, RankingContext } from '@/lib/ranking-cells';

export interface RowCellView {
  problemId: string;
  /** The problem's label ("A"): the phone list prints it in the cell. */
  label: string;
  to?: RouteLocationRaw;
  view: RankingCellView;
}
/** What one row prints: its cells, its total and its cumulative time. Built once per board read, for the table and the list. */
export interface RowView {
  cells: RowCellView[];
  total: string;
  time: string;
}

export const rowViewOf = (
  row: RankingRow,
  problems: readonly RankingProblem[],
  context: RankingContext,
  linkOf: (row: RankingRow, problem: RankingProblem) => RouteLocationRaw | undefined,
): RowView => ({
  cells: problems.map((problem) => ({
    problemId: problem.problemId,
    label: problem.label,
    to: linkOf(row, problem),
    view: rankingCell(row.cells[problem.problemId], problem, row.participationId, context),
  })),
  total: totalScoreText(row.score, problems, context),
  time: formatCumtime(context.formatName, row.cumtime, context.locale),
});

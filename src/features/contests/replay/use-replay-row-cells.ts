import { computed } from 'vue';
import type { Ref } from 'vue';
import type { RankingProblem } from '@/api/types/contests';
import { formatNumber } from '@/lib/format';
import { formatCumtime, isPenaltyFormat, rankingCell, solvedCount } from '@/lib/ranking-cells';
import type { RankingCellView, RankingContext } from '@/lib/ranking-cells';
import type { BoardRow, ReplayBoard } from './replay-board';

/** What a row prints besides its rank and name. Reused (same object) while nothing it reads has changed. */
export interface ReplayRowCells {
  cells: { problemId: string; view: RankingCellView }[];
  score: string;
  cumtime: string;
  /**
   * What the cells were built from, compared by identity. The first-solve star needs no key of its own: whether a row holds
   * it at a second depends only on when that row solved (anyone earlier is already on the board), so it changes with the
   * row's own `revision`.
   */
  source: { revision: object; context: RankingContext };
}

function buildRowCells(
  row: BoardRow,
  problems: RankingProblem[],
  context: RankingContext,
): ReplayRowCells {
  const score = isPenaltyFormat(context.formatName)
    ? String(solvedCount({ cells: row.cells, participationId: row.id }, problems, context))
    : formatNumber(row.score, context.locale, context.pointsPrecision);
  return {
    cells: problems.map((problem) => ({
      problemId: problem.problemId,
      view: rankingCell(row.cells[problem.problemId], problem, row.id, context),
    })),
    score,
    cumtime: formatCumtime(context.formatName, row.cumtime),
    source: { revision: row.revision, context },
  };
}

const isSameSource = (kept: ReplayRowCells['source'], row: BoardRow, context: RankingContext) =>
  kept.revision === row.revision && kept.context === context;

/**
 * Each row's printed cells, by row id. A tick on a big board changes a few rows: every other row keeps its object, so the
 * table's `v-memo` and `RankingCell` skip it. The map of the previous tick is the only state kept between ticks.
 */
export function useReplayRowCells(board: Ref<ReplayBoard>, context: Ref<RankingContext>) {
  let previous = new Map<string, ReplayRowCells>();
  return computed(() => {
    const next = new Map<string, ReplayRowCells>();
    const { problems, rows } = board.value;
    for (const row of rows) {
      const kept = previous.get(row.id);
      next.set(
        row.id,
        kept && isSameSource(kept.source, row, context.value)
          ? kept
          : buildRowCells(row, problems, context.value),
      );
    }
    previous = next;
    return next;
  });
}

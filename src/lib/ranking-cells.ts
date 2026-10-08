import type { ProblemCell, RankingProblem, RankingRow } from '@/api/types/contests';
import { formatElapsed } from './format';

export type CellKind = 'empty' | 'first-solve' | 'solved' | 'partial' | 'failed' | 'pending';
export interface RankingCellView {
  kind: CellKind;
  /** What the cell shows; the label says the same in words for screen readers. */
  text: string;
  labelKey: string;
  labelParams: Record<string, string | number>;
  partialStep?: 1 | 2 | 3;
}

/** Formats whose cells carry tries (and a penalty) instead of a plain score. */
const PENALTY_FORMATS = new Set(['icpc', 'vnoj']);
export const isPenaltyFormat = (formatName: string) => PENALTY_FORMATS.has(formatName);

/** Frozen cells already carry 0 points, so they never count. */
export const solvedCount = (row: Pick<RankingRow, 'cells'>) =>
  Object.values(row.cells).filter((cell) => Number(cell.points ?? 0) > 0).length;

/** icpc counts minutes, every other format seconds (backend: libs/contests/src/formats). */
export const formatCumtime = (formatName: string, cumtime: number) =>
  formatName === 'icpc' ? String(cumtime) : formatElapsed(cumtime);

const EMPTY: RankingCellView = {
  kind: 'empty',
  text: '',
  labelKey: 'ranking.cell.empty',
  labelParams: {},
};
const scoreText = (points: number) => String(Math.round(points * 100) / 100);

interface Tries {
  /** Wrong submissions before the solve, or all of them while unsolved. */
  wrong: number;
  /** Submissions whose result is withheld by the freeze. */
  pending: number;
}
/** Each penalty format stores its tries differently; this is the only place that knows. */
const READ_TRIES: Record<string, (cell: ProblemCell) => Tries> = {
  /** `{time, points, tries, pending: boolean}` */
  icpc: (cell) => {
    const tries = Number(cell.tries ?? 0);
    return {
      wrong: Math.max(tries - (Number(cell.points ?? 0) > 0 ? 1 : 0), 0),
      pending: cell.pending === true ? tries : 0,
    };
  },
  /** `{time, points, penalty: wrong tries, pending: number of tries after the freeze}` */
  vnoj: (cell) => ({ wrong: Number(cell.penalty ?? 0), pending: Number(cell.pending ?? 0) }),
};

function penaltyCell(cell: ProblemCell, formatName: string, isFirst: boolean): RankingCellView {
  const { wrong, pending } = READ_TRIES[formatName]!(cell);
  if (Number(cell.points ?? 0) > 0) {
    const time = formatElapsed(Number(cell.time ?? 0));
    return {
      kind: isFirst ? 'first-solve' : 'solved',
      text: `+${wrong || ''} ${time}`,
      labelKey: isFirst ? 'ranking.cell.firstSolve' : 'ranking.cell.solved',
      labelParams: { tries: wrong, time },
    };
  }
  if (pending > 0)
    return {
      kind: 'pending',
      text: `?${pending}`,
      labelKey: 'ranking.cell.pending',
      labelParams: { tries: pending },
    };
  return wrong > 0
    ? {
        kind: 'failed',
        text: `−${wrong}`,
        labelKey: 'ranking.cell.failed',
        labelParams: { tries: wrong },
      }
    : EMPTY;
}

function pointsCell(cell: ProblemCell, problem: RankingProblem, isFirst: boolean): RankingCellView {
  const points = Number(cell.points ?? 0);
  const text = scoreText(points);
  const labelled = { text, labelKey: 'ranking.cell.points', labelParams: { points: text } };
  if (points >= problem.points) return { kind: isFirst ? 'first-solve' : 'solved', ...labelled };
  if (points <= 0) return { kind: 'failed', ...labelled };
  return {
    kind: 'partial',
    partialStep: Math.min(3, Math.ceil((points / problem.points) * 3)) as 1 | 2 | 3,
    ...labelled,
  };
}

export function rankingCell(
  cell: ProblemCell | undefined,
  problem: RankingProblem,
  participationId: string,
  formatName: string,
): RankingCellView {
  if (!cell) return EMPTY;
  const isFirst = problem.firstSolve === participationId;
  return isPenaltyFormat(formatName)
    ? penaltyCell(cell, formatName, isFirst)
    : pointsCell(cell, problem, isFirst);
}

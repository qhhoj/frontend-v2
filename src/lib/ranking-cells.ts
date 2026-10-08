import type {
  ContestFormatName,
  ProblemCell,
  RankingProblem,
  RankingRow,
} from '@/api/types/contests';
import type { Locale } from '@/i18n';
import { formatElapsed, formatNumber } from './format';

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
const PENALTY_FORMATS = new Set<ContestFormatName>(['icpc', 'vnoj']);
export const isPenaltyFormat = (formatName: ContestFormatName) => PENALTY_FORMATS.has(formatName);

/** How a contest prints its cells and scores. */
export interface RankingContext {
  formatName: ContestFormatName;
  pointsPrecision: number;
  locale: Locale;
}

const roundTo = (value: number, precision: number) => {
  const scale = 10 ** precision;
  return Math.round(value * scale) / scale;
};
/** Float sums such as 99.999999 count as the full score once rounded to the contest precision. */
const isFullPoints = (points: number, problem: RankingProblem, precision: number) =>
  roundTo(points, precision) >= roundTo(problem.points, precision);

/** icpc counts minutes, every other format seconds (backend: libs/contests/src/formats). */
export const formatCumtime = (formatName: ContestFormatName, cumtime: number) =>
  formatName === 'icpc' ? String(cumtime) : formatElapsed(cumtime);

/** ioi16 and final_submission never accumulate time. */
const NO_CUMTIME_FORMATS = new Set<ContestFormatName>(['ioi16', 'final_submission']);
export const showsCumtime = (formatName: ContestFormatName) => !NO_CUMTIME_FORMATS.has(formatName);

const EMPTY: RankingCellView = {
  kind: 'empty',
  text: '',
  labelKey: 'ranking.cell.empty',
  labelParams: {},
};
const pointsText = (points: number, { pointsPrecision, locale }: RankingContext) =>
  formatNumber(roundTo(points, pointsPrecision), locale, pointsPrecision);

interface Tries {
  /** Wrong submissions before the solve, or all of them while unsolved. */
  wrong: number;
  /** Submissions whose result is withheld by the freeze. */
  pending: number;
}
/** Each penalty format stores its tries differently; this is the only place that knows. */
const READ_TRIES: Partial<Record<ContestFormatName, (cell: ProblemCell) => Tries>> = {
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

function penaltyCell(
  cell: ProblemCell,
  problem: RankingProblem,
  isFirst: boolean,
  context: RankingContext,
): RankingCellView {
  const { wrong, pending } = READ_TRIES[context.formatName]!(cell);
  const points = Number(cell.points ?? 0);
  // icpc scores 0 or the problem's points; vnoj can score part of them and is solved only at full points.
  const solved =
    context.formatName === 'icpc'
      ? points > 0
      : isFullPoints(points, problem, context.pointsPrecision);
  if (solved) {
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
  if (points > 0) return partialCell(points, problem, context);
  return wrong > 0
    ? {
        kind: 'failed',
        text: `−${wrong}`,
        labelKey: 'ranking.cell.failed',
        labelParams: { tries: wrong },
      }
    : EMPTY;
}

function partialCell(
  points: number,
  problem: RankingProblem,
  context: RankingContext,
): RankingCellView {
  const text = pointsText(points, context);
  return {
    kind: 'partial',
    text,
    labelKey: 'ranking.cell.points',
    labelParams: { points: text },
    partialStep: Math.min(3, Math.ceil((points / problem.points) * 3)) as 1 | 2 | 3,
  };
}

function pointsCell(
  cell: ProblemCell,
  problem: RankingProblem,
  isFirst: boolean,
  context: RankingContext,
): RankingCellView {
  const points = Number(cell.points ?? 0);
  if (isFullPoints(points, problem, context.pointsPrecision)) {
    const text = pointsText(points, context);
    return {
      kind: isFirst ? 'first-solve' : 'solved',
      text,
      labelKey: 'ranking.cell.points',
      labelParams: { points: text },
    };
  }
  if (points <= 0) {
    const text = pointsText(0, context);
    return { kind: 'failed', text, labelKey: 'ranking.cell.points', labelParams: { points: text } };
  }
  return partialCell(points, problem, context);
}

export function rankingCell(
  cell: ProblemCell | undefined,
  problem: RankingProblem,
  participationId: string,
  context: RankingContext,
): RankingCellView {
  if (!cell) return EMPTY;
  const isFirst = problem.firstSolve === participationId;
  return isPenaltyFormat(context.formatName)
    ? penaltyCell(cell, problem, isFirst, context)
    : pointsCell(cell, problem, isFirst, context);
}

/** Problems the row has solved in full (frozen cells carry 0 points, so they never count). */
export const solvedCount = (
  row: Pick<RankingRow, 'cells' | 'participationId'>,
  problems: RankingProblem[],
  context: RankingContext,
) =>
  problems.filter((problem) => {
    const { kind } = rankingCell(
      row.cells[problem.problemId],
      problem,
      row.participationId,
      context,
    );
    return kind === 'solved' || kind === 'first-solve';
  }).length;

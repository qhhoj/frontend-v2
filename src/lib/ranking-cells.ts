import type {
  ContestFormatName,
  ProblemCell,
  RankingProblem,
  RankingRow,
} from '@/api/types/contests';
import { translate } from '@/i18n';
import type { Locale } from '@/i18n';
import { daysHoursOf } from './contest-time';
import { formatElapsed, formatElapsedSeconds, formatNumber } from './format';
import { daysHoursText } from './use-countdown-text';
import type { Translate } from './use-countdown-text';

export type CellKind = 'empty' | 'first-solve' | 'solved' | 'partial' | 'failed' | 'pending';
export interface RankingCellView {
  kind: CellKind;
  /** What the cell shows; the label says the same in words for screen readers. */
  text: string;
  /** The small second line (`0:08:12`): the solve time of a points or penalty cell. */
  time?: string;
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
  /** The format prints solve times (`showsCellTime`); the first-solve star needs them too. */
  showsTime: boolean;
}

/**
 * Which formats print a time in their cells (backend libs/contests/src/formats): ioi only with `cumtime` or
 * `lastScoreAltering`; ioi16 and final_submission store `time: 0` on every cell; the rest always.
 */
export function showsCellTime(
  formatName: ContestFormatName,
  formatConfig: Record<string, number | boolean>,
): boolean {
  if (formatName === 'ioi')
    return formatConfig.cumtime === true || formatConfig.lastScoreAltering === true;
  return formatName !== 'ioi16' && formatName !== 'final_submission';
}

const roundTo = (value: number, precision: number) => {
  const scale = 10 ** precision;
  return Math.round(value * scale) / scale;
};
/** Full points up to float noise (99.99999999999999 of 100), not up to display rounding (99.5 is partial). Zero points never solve, even on a 0-point problem. */
const isFullPoints = (points: number, problem: RankingProblem) =>
  points > 0 && points >= problem.points - 1e-9 * Math.max(1, problem.points);

/** ioi16 and final_submission never accumulate time. */
const NO_CUMTIME_FORMATS = new Set<ContestFormatName>(['ioi16', 'final_submission']);
export const showsCumtime = (formatName: ContestFormatName) => !NO_CUMTIME_FORMATS.has(formatName);

/**
 * From 100 hours a cell's clock (`2735:36:42`, or `2735:36` on penalty boards) no longer reads at a glance, nor fits
 * the cell: it says `113 ng 23 g` instead (P-18). Below that, `H:MM:SS` fits up to 99:59:59.
 */
const LONG_CELL_SECONDS = 100 * 3600;
/** A cell's solve time: shown short, and in full words for screen readers. */
function cellElapsed(
  seconds: number,
  formatBelowLong: (seconds: number) => string,
  locale: Locale,
): { shown: string; spoken: string } {
  if (seconds < LONG_CELL_SECONDS) {
    const clock = formatBelowLong(seconds);
    return { shown: clock, spoken: clock };
  }
  const inLocale: Translate = (key, named, plural) => translate(key, named, { locale, plural });
  const span = daysHoursOf(seconds);
  return {
    shown: daysHoursText(inLocale, span, true),
    spoken: daysHoursText(inLocale, span, false),
  };
}

/**
 * icpc counts minutes, every other format seconds (backend: libs/contests/src/formats). A total in seconds says days
 * and hours from 100 hours, as the cells do (P-18).
 */
export const formatCumtime = (formatName: ContestFormatName, cumtime: number, locale: Locale) =>
  formatName === 'icpc' ? String(cumtime) : cellElapsed(cumtime, formatElapsed, locale).shown;

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
      // With penalty 0 the backend stores no tries, so a pending cell holds at least one.
      pending: cell.pending === true ? Math.max(tries, 1) : 0,
    };
  },
  /** `{time, points, penalty: wrong tries, pending: number of tries after the freeze}` */
  vnoj: (cell) => ({ wrong: Number(cell.penalty ?? 0), pending: Number(cell.pending ?? 0) }),
};

function solvedPenaltyCell(
  cell: ProblemCell,
  wrong: number,
  isFirst: boolean,
  locale: Locale,
): RankingCellView {
  const time = cellElapsed(Number(cell.time ?? 0), formatElapsed, locale);
  return {
    kind: isFirst ? 'first-solve' : 'solved',
    text: `+${wrong || ''}`,
    time: time.shown,
    labelKey: isFirst ? 'ranking.cell.firstSolve' : 'ranking.cell.solved',
    labelParams: { tries: wrong, time: time.spoken },
  };
}

function penaltyCell(
  cell: ProblemCell,
  problem: RankingProblem,
  isFirst: boolean,
  context: RankingContext,
): RankingCellView {
  const { wrong, pending } = READ_TRIES[context.formatName]!(cell);
  const points = Number(cell.points ?? 0);
  // icpc scores 0 or the problem's points; vnoj can score part of them and is solved only at full points.
  const solved = context.formatName === 'icpc' ? points > 0 : isFullPoints(points, problem);
  if (solved) return solvedPenaltyCell(cell, wrong, isFirst, context.locale);
  if (pending > 0)
    return {
      kind: 'pending',
      text: `?${pending}`,
      labelKey: 'ranking.cell.pending',
      labelParams: { tries: pending },
    };
  if (points > 0) return partialCell(points, problem, cell, context);
  return wrong > 0
    ? {
        kind: 'failed',
        text: `−${wrong}`,
        labelKey: 'ranking.cell.failed',
        labelParams: { tries: wrong },
      }
    : EMPTY;
}

const cellTime = (cell: ProblemCell, context: RankingContext) =>
  context.showsTime && typeof cell.time === 'number'
    ? cellElapsed(cell.time, formatElapsedSeconds, context.locale)
    : undefined;

/** Full or partial points, with the time under them when the format has one. */
function scoredCell(
  points: number,
  cell: ProblemCell,
  kind: 'first-solve' | 'solved' | 'partial',
  context: RankingContext,
): Omit<RankingCellView, 'partialStep'> {
  const text = pointsText(points, context);
  const time = cellTime(cell, context);
  if (time === undefined)
    return { kind, text, labelKey: 'ranking.cell.points', labelParams: { points: text } };
  const labelKey = kind === 'first-solve' ? 'ranking.cell.firstPointsAt' : 'ranking.cell.pointsAt';
  return {
    kind,
    text,
    time: time.shown,
    labelKey,
    labelParams: { points: text, time: time.spoken },
  };
}

function partialCell(
  points: number,
  problem: RankingProblem,
  cell: ProblemCell,
  context: RankingContext,
): RankingCellView {
  return {
    ...scoredCell(points, cell, 'partial', context),
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
  if (isFullPoints(points, problem))
    return scoredCell(points, cell, isFirst ? 'first-solve' : 'solved', context);
  if (points <= 0) {
    const text = pointsText(0, context);
    return { kind: 'failed', text, labelKey: 'ranking.cell.points', labelParams: { points: text } };
  }
  return partialCell(points, problem, cell, context);
}

export function rankingCell(
  cell: ProblemCell | undefined,
  problem: RankingProblem,
  participationId: string,
  context: RankingContext,
): RankingCellView {
  if (!cell) return EMPTY;
  // A first solve needs a time to be first by (Cells A); ioi16 can name one with time 0.
  const isFirst = problem.firstSolve === participationId && context.showsTime;
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

import type { RankingCellView } from '@/lib/ranking-cells';

/**
 * Column widths of the ranking board, in rem. The table uses a fixed layout, so a column keeps its width whatever
 * rows, names or cells arrive. The loading skeleton uses the same numbers.
 * The score, penalty and problem columns grow to the widest text the board prints (a 30-day contest's "+12 12 ng 17 g"),
 * so no text is cut and none is drawn over the next column.
 */
export const RANK_COLUMN_REM = 3.5;
/** The narrowest score column: a points total and its time ("1.106,3 62:55"). */
export const SCORE_COLUMN_REM = 5.5;
export const TIME_COLUMN_REM = 5;
/** The narrowest problem column: a penalty cell ("+1 1:32", "−3", "?2") with room for the header. */
export const PROBLEM_COLUMN_REM = 4.5;
/** "+42 → 1843": shown once the contest's ratings are applied. */
export const RATING_COLUMN_REM = 8;
/** The name column fits the longest name and stops at 240 px (15 rem); longer names are cut with a tooltip. */
export const NAME_COLUMN_MIN_REM = 10;
export const NAME_COLUMN_MAX_REM = 15;
/**
 * On a phone the name column is fixed and narrow (it stays while the cells scroll) and rank, score and penalty shrink to
 * what they print (their cells carry 4 px of padding there), so at 390 px the first problem column shows whole at rest:
 * 2.5 + 7 + 3 + 3.5 = 16 rem of 22.4, and a problem column is 4.5.
 */
export const NAME_COLUMN_PHONE_REM = 7;
export const RANK_COLUMN_PHONE_REM = 2.5;
export const SCORE_COLUMN_PHONE_REM = 3;
export const TIME_COLUMN_PHONE_REM = 3.5;
/** Avatar (24 px), its gap and the cell's padding, then about 0.5 rem per character of the name (13 px, medium). */
const NAME_FIXED_REM = 4.5;
const NAME_CHAR_REM = 0.5;

/** The board's numbers are JetBrains Mono: every character is 0.6 em wide, so a text's width follows from its length. */
const MONO_EM = 0.6;
const ROOT_PX = 16;
/** `text-sm` (cells, scores) and `text-tiny` (times). */
const TEXT_PX = 14;
const TINY_PX = 11;
/** The total score column prints `text-base`. */
const TOTAL_PX = 16;
const textRem = (text: string, fontPx: number) => (text.length * MONO_EM * fontPx) / ROOT_PX;
/** 4 px spare so a hover ring or a rounding never clips. */
const SPARE_REM = 0.25;
/** Widths move in half-rem steps, so a poll that adds one character rarely moves the board. */
const roundUp = (rem: number) => Math.ceil(rem * 2) / 2;

/** The cell's padding (td 2 px and box 4 px each side); the score and the time are two lines, so the wider one counts. */
const CELL_PADDING_REM = 0.75;
const cellRem = (view: RankingCellView) =>
  CELL_PADDING_REM +
  Math.max(textRem(view.text, TEXT_PX), view.time ? textRem(view.time, TINY_PX) : 0) +
  SPARE_REM;

/** The name column: as wide as the longest name, between the minimum and the cap. */
export const nameColumnRem = (names: Iterable<string>) => {
  let longest = 0;
  for (const name of names) longest = Math.max(longest, name.length);
  const fit = roundUp(NAME_FIXED_REM + longest * NAME_CHAR_REM);
  return Math.min(NAME_COLUMN_MAX_REM, Math.max(NAME_COLUMN_MIN_REM, fit));
};

/** One width for every problem column: the widest cell of the board. */
export const problemColumnRem = (views: Iterable<RankingCellView>) => {
  let widest = PROBLEM_COLUMN_REM;
  for (const view of views) widest = Math.max(widest, cellRem(view));
  return roundUp(widest);
};

/** The score cell's padding (6 px each side); the total (large) and the time under it on points boards are two lines, so the wider one counts. */
const SCORE_PADDING_REM = 0.75;
export const scoreColumnRem = (
  scores: Iterable<{ total: string; time?: string }>,
  floorRem = SCORE_COLUMN_REM,
) => {
  let widest = floorRem;
  for (const { total, time } of scores)
    widest = Math.max(
      widest,
      SCORE_PADDING_REM +
        Math.max(textRem(total, TOTAL_PX), time ? textRem(time, TINY_PX) : 0) +
        SPARE_REM,
    );
  return roundUp(widest);
};

/** The penalty column: icpc minutes, or a vnoj total that turns into days and hours from 100 hours. */
export const timeColumnRem = (times: Iterable<string>, floorRem = TIME_COLUMN_REM) => {
  let widest = floorRem;
  for (const time of times) widest = Math.max(widest, textRem(time, TEXT_PX) + 2 * SPARE_REM);
  return roundUp(widest);
};

/** The widths right of the name column; null where the board has no such column. */
export interface StatsColumns {
  scoreRem: number;
  timeRem: number | null;
  ratingRem: number | null;
  problemRem: number;
}
export const DEFAULT_STATS_COLUMNS: StatsColumns = {
  scoreRem: SCORE_COLUMN_REM,
  timeRem: null,
  ratingRem: null,
  problemRem: PROBLEM_COLUMN_REM,
};

/** Width of everything right of the name column. */
export const statsWidthRem = (problemCount: number, columns: StatsColumns) =>
  columns.scoreRem +
  (columns.timeRem ?? 0) +
  (columns.ratingRem ?? 0) +
  problemCount * columns.problemRem;

/** The table is exactly as wide as its columns: no empty band in the name column. */
export const tableWidthRem = (
  nameRem: number,
  problemCount: number,
  columns: StatsColumns,
  rankRem = RANK_COLUMN_REM,
) => rankRem + nameRem + statsWidthRem(problemCount, columns);

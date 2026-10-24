/**
 * Column widths of the ranking board, in rem. The table uses a fixed layout, so a column keeps its width whatever
 * rows, names or cells arrive; the name column takes the rest. The loading skeleton uses the same numbers.
 */
export const RANK_COLUMN_REM = 5;
export const SCORE_COLUMN_REM = 7;
export const TIME_COLUMN_REM = 7;
export const PROBLEM_COLUMN_REM = 6;
/** "+42 → 1843": shown once the contest's ratings are applied. */
export const RATING_COLUMN_REM = 8;
/** Narrowest the name column gets before the board scrolls sideways. */
export const NAME_COLUMN_MIN_REM = 14;

/** Width of everything right of the name column. */
export const statsWidthRem = (problemCount: number, hasTimeColumn: boolean) =>
  SCORE_COLUMN_REM + (hasTimeColumn ? TIME_COLUMN_REM : 0) + problemCount * PROBLEM_COLUMN_REM;

export const tableMinWidthRem = (problemCount: number, hasTimeColumn: boolean) =>
  RANK_COLUMN_REM + NAME_COLUMN_MIN_REM + statsWidthRem(problemCount, hasTimeColumn);

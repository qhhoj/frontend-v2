/**
 * Column widths of the ranking board, in rem. The table uses a fixed layout, so a column keeps its width whatever
 * rows, names or cells arrive; the name column takes the rest. The loading skeleton uses the same numbers.
 */
export const RANK_COLUMN_REM = 5;
/** Wide enough for a points total and its time on one line ("1.106,3 62:55"). */
export const SCORE_COLUMN_REM = 8;
export const TIME_COLUMN_REM = 7;
/** A penalty cell on one line: "+1 1:32", "−3", "?2". */
export const PROBLEM_COLUMN_REM = 6;
/** A points cell with its solve time on one line: "99,99 4:19:50". */
export const TIMED_POINTS_COLUMN_REM = 8;
/** "+42 → 1843": shown once the contest's ratings are applied. */
export const RATING_COLUMN_REM = 8;
/** Narrowest the name column gets before the board scrolls sideways. */
export const NAME_COLUMN_MIN_REM = 14;

/** Width of everything right of the name column. */
export const statsWidthRem = (
  problemCount: number,
  hasTimeColumn: boolean,
  problemRem = PROBLEM_COLUMN_REM,
) => SCORE_COLUMN_REM + (hasTimeColumn ? TIME_COLUMN_REM : 0) + problemCount * problemRem;

export const tableMinWidthRem = (
  problemCount: number,
  hasTimeColumn: boolean,
  problemRem = PROBLEM_COLUMN_REM,
) => RANK_COLUMN_REM + NAME_COLUMN_MIN_REM + statsWidthRem(problemCount, hasTimeColumn, problemRem);

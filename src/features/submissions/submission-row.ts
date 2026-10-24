import type { SubmissionListItem } from '@/api/types/submissions';
import { FINISHED_STATUSES } from '@/api/types/submissions';
import { formatCaseMemory, formatCaseTime, formatNumber, scoreBelowFull } from '@/lib/format';
import type { Locale } from '@/i18n';
import { ringFraction } from '@/lib/grading';

export const NO_VALUE = '—';
const PERCENT = 100;
const POINT_FRACTION_DIGITS = 2;

export const isFinished = (row: SubmissionListItem) => FINISHED_STATUSES.includes(row.status);

/** "738.46 / 1000" ("738.46/1000" when `tight`), or just the score where the problem's max points are unknown (an older backend). Empty when the row has no score. */
export function scoreText(row: SubmissionListItem, locale: Locale, tight = false): string {
  if (row.points === null) return '';
  const max: number | undefined = row.problem?.points;
  const shown = scoreBelowFull(row.points, max, POINT_FRACTION_DIGITS);
  const score = formatNumber(shown, locale, POINT_FRACTION_DIGITS, false);
  return max === undefined
    ? score
    : `${score}${tight ? '/' : ' / '}${formatNumber(max, locale, POINT_FRACTION_DIGITS, false)}`;
}

/** The share of the points judged so far, `45%`; only a grading row with a known case count has one. */
export const gradingPercent = (row: SubmissionListItem) =>
  row.status === 'G' && row.caseTotal > 0 ? `${Math.round(ringFraction(row) * PERCENT)}%` : '';

/** "0.12s · 3.2 MB": only a finished row has numbers worth showing. */
export const costText = (row: SubmissionListItem) =>
  isFinished(row) && row.time !== null && row.memory !== null
    ? `${formatCaseTime(row.time)} · ${formatCaseMemory(row.memory)}`
    : NO_VALUE;

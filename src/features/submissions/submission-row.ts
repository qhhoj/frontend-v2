import type { SubmissionListItem } from '@/api/types/submissions';
import { FINISHED_STATUSES } from '@/api/types/submissions';
import {
  NO_VALUE,
  formatCaseMemory,
  formatCaseTime,
  formatNumber,
  scoreBelowFull,
} from '@/lib/format';
import { translate } from '@/i18n';
import type { Locale } from '@/i18n';
import { ringFraction } from '@/lib/grading';
import { submissionVerdictOf } from '@/lib/verdicts';
import type { VerdictTone } from '@/lib/verdicts';
import type { CueTone } from '@/components/ui/cue-tones';

const PERCENT = 100;
const POINT_FRACTION_DIGITS = 2;

export const isFinished = (row: SubmissionListItem) => FINISHED_STATUSES.includes(row.status);

/** "738.46 / 1000" ("738.46/1000" when `tight`), or just the score where the max points are unknown (an older backend). */
function scorePair(points: number, max: number | undefined, locale: Locale, tight: boolean) {
  const shown = scoreBelowFull(points, max, POINT_FRACTION_DIGITS);
  const score = formatNumber(shown, locale, POINT_FRACTION_DIGITS, false);
  return max === undefined
    ? score
    : `${score}${tight ? '/' : ' / '}${formatNumber(max, locale, POINT_FRACTION_DIGITS, false)}`;
}

/** The row's score as the problem scores it; empty when the row has no score. */
export function scoreText(row: SubmissionListItem, locale: Locale, tight = false): string {
  return row.points === null ? '' : scorePair(row.points, row.problem?.points, locale, tight);
}

/** A contest list scores a row by its contest points over the contest problem's, as the ranking does; else as `scoreText`. */
export function listScoreText(
  row: SubmissionListItem,
  locale: Locale,
  contestMax: number | undefined,
  tight = false,
): string {
  const contestPoints = row.contest?.points ?? null;
  return contestMax !== undefined && contestPoints !== null
    ? scorePair(contestPoints, contestMax, locale, tight)
    : scoreText(row, locale, tight);
}

/** Full, partial or zero by points over the maximum; nothing while the maximum is unknown and the score is above zero. */
export function scoreTone(points: number | null, max: number | undefined | null): CueTone | null {
  if (points === null) return null;
  if (points <= 0) return 'zero';
  if (max === undefined || max === null || max <= 0) return null;
  return points >= max ? 'full' : 'partial';
}

/** The cue of a finished row's score (contest points over the contest problem's in a contest), or none. */
export function scoreCue(row: SubmissionListItem, contestMax: number | undefined): CueTone | null {
  if (!isFinished(row)) return null;
  const contestPoints = row.contest?.points ?? null;
  return contestMax !== undefined && contestPoints !== null
    ? scoreTone(contestPoints, contestMax)
    : scoreTone(row.points, row.problem?.points);
}

/** The points a list row counts: contest points over the contest problem's in a contest list, else the problem's own. */
function countedScore(row: SubmissionListItem, contestMax: number | undefined) {
  const contestPoints = row.contest?.points ?? null;
  return contestMax !== undefined && contestPoints !== null
    ? { points: contestPoints, max: contestMax as number | undefined }
    : { points: row.points, max: row.problem?.points };
}

/** A judged row's score in two parts, "560" and "800" (no maximum where it is unknown); null when the row has no score. */
export function scoreParts(
  row: SubmissionListItem,
  locale: Locale,
  contestMax: number | undefined,
): { earned: string; max: string } | null {
  const { points, max } = countedScore(row, contestMax);
  if (points === null) return null;
  const shown = scoreBelowFull(points, max, POINT_FRACTION_DIGITS);
  return {
    earned: formatNumber(shown, locale, POINT_FRACTION_DIGITS, false),
    max: max === undefined ? '' : formatNumber(max, locale, POINT_FRACTION_DIGITS, false),
  };
}

/** The colour of a judged row's score: part of the points is the partial tone whatever the verdict, else the verdict's own. */
export function scoreToneOf(
  row: SubmissionListItem,
  contestMax: number | undefined,
): VerdictTone | null {
  if (!isFinished(row)) return null;
  const { points, max } = countedScore(row, contestMax);
  const isPart = points !== null && max !== undefined && points > 0 && points < max;
  return isPart ? 'pc' : submissionVerdictOf(row).tone;
}

/** The share of the points judged so far, `45%`; only a grading row with a known case count has one. */
export const gradingPercent = (row: SubmissionListItem) =>
  row.status === 'G' && row.caseTotal > 0 ? `${Math.round(ringFraction(row) * PERCENT)}%` : '';

/** "0.12s · 3.2 MB": only a finished row has numbers worth showing. */
export const costText = (row: SubmissionListItem) =>
  isFinished(row) && row.time !== null && row.memory !== null
    ? `${formatCaseTime(row.time)} · ${formatCaseMemory(row.memory)}`
    : NO_VALUE;

/** The score cell of a list row: the score once judged; while grading the share judged; "Trong hàng đợi" when queued; empty otherwise. */
export function scoreCellText(
  row: SubmissionListItem,
  locale: Locale,
  contestMax: number | undefined,
  tight = false,
): string {
  if (isFinished(row)) return listScoreText(row, locale, contestMax, tight);
  const { code, labelKey } = submissionVerdictOf(row);
  if (code === 'G') return gradingPercent(row);
  if (code === 'QU') return translate(tight ? 'submissions.queuedShort' : 'submissions.queued');
  return code === 'P' ? translate(labelKey) : '';
}

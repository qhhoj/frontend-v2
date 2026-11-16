import { SUBMISSION_RESULT_CODES } from '@/api/types/submissions';
import { VERDICT_TONES, blockToneOf, verdictOf } from '@/lib/verdicts';
import type { BlockTone } from '@/lib/verdicts';
import type { SubmissionResult } from '@/api/types/submissions';

export interface VerdictCount {
  result: string;
  count: number;
}

export interface VerdictShare {
  result: string;
  count: number;
  /** Whole percent; the shares of one distribution add up to exactly 100. */
  percent: number;
  tone: BlockTone;
}

const PERCENT = 100;
const RESULT_ORDER: readonly string[] = SUBMISSION_RESULT_CODES;

/** A result code the frontend does not know yet is drawn as a system outcome. */
const toneOf = (result: string): BlockTone =>
  result in VERDICT_TONES
    ? blockToneOf(verdictOf({ status: 'D', result: result as SubmissionResult }))
    : 'sys';

/** Known results in the verdict order (AC first), unknown ones after them by name: the bar keeps the same colours in the same places. */
const byVerdictOrder = (left: VerdictCount, right: VerdictCount) => {
  const rank = (result: string) => {
    const index = RESULT_ORDER.indexOf(result);
    return index === -1 ? RESULT_ORDER.length : index;
  };
  return rank(left.result) - rank(right.result) || left.result.localeCompare(right.result);
};

/** Whole percents by the largest remainder, so they add up to 100 (ties go to the earlier result). */
function wholePercents(counts: readonly number[], total: number): number[] {
  const exact = counts.map((count) => (count * PERCENT) / total);
  const floors = exact.map(Math.floor);
  const left = PERCENT - floors.reduce((sum, value) => sum + value, 0);
  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((left, right) => right.remainder - left.remainder || left.index - right.index);
  for (const { index } of byRemainder.slice(0, left)) floors[index]! += 1;
  return floors;
}

/** Today's verdict counts as the bar's segments: empty results dropped, verdict order, whole percents adding up to 100. Empty when nothing was judged. */
export function verdictShares(counts: readonly VerdictCount[]): VerdictShare[] {
  const kept = counts.filter(({ count }) => count > 0).sort(byVerdictOrder);
  const total = kept.reduce((sum, { count }) => sum + count, 0);
  if (total === 0) return [];
  const percents = wholePercents(
    kept.map(({ count }) => count),
    total,
  );
  return kept.map(({ result, count }, index) => ({
    result,
    count,
    percent: percents[index]!,
    tone: toneOf(result),
  }));
}

/** "12%", or "<1%" for a result too rare to round up to a whole percent. */
export const shareLabel = ({ percent, count }: VerdictShare) =>
  percent === 0 && count > 0 ? '<1%' : `${percent}%`;

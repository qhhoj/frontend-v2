import { FINISHED_STATUSES } from '@/api/types/submissions';
import type { SubmissionStatus } from '@/api/types/submissions';
import { scoreOnScale } from '@/features/problems/submit-result';
import type { ScoreScale } from '@/features/problems/submit-result';
import type { Verdict } from '@/lib/verdicts';

export interface VerdictToastCase {
  verdict: Verdict;
  /** The submission's result is already in front of the viewer (its page, or the open result strip). */
  isResultOnScreen: boolean;
  /** The problem showed as solved when the submission was sent. */
  wasSolvedBefore: boolean;
  /** Bit already popped for this problem in this tab, for a second submission sent before the first one finished. */
  hasCelebratedProblem: boolean;
}

/**
 * What the viewer is told about a final verdict: nothing when the result is already on screen, otherwise one toast. Bit
 * pops only on a full accepted verdict (never a partial score) that is the viewer's first solve of the problem.
 */
export function planVerdictToast(input: VerdictToastCase): { celebrate: boolean } | null {
  if (input.isResultOnScreen) return null;
  const isFirstSolve =
    input.verdict.code === 'AC' && !input.wasSolvedBefore && !input.hasCelebratedProblem;
  return { celebrate: isFirstSolve };
}

/**
 * What to do with a followed submission's status: wait while it is judged, announce once it is finished, and drop it when it
 * will not change on its own (`PD`: the contest judges it at the end, and the page shows no result for it either).
 */
export function trackingStep(status: SubmissionStatus): 'wait' | 'announce' | 'drop' {
  if (status === 'PD') return 'drop';
  return FINISHED_STATUSES.includes(status) ? 'announce' : 'wait';
}

export interface ToastScore {
  score: number;
  max: number;
  /** Decimals of the contest's scale; null on the site scale. */
  contestPrecision: number | null;
}

/**
 * The score for the toast, or null when it cannot be told right. A contest submission is scored only on the scale of the
 * contest it was sent in (the one the problem page knew); the site scale never stands in for it.
 */
export function toastScore(input: {
  points: number;
  problemPoints: number;
  contest: { key: string; points: number | null } | null;
  scale: ScoreScale;
}): ToastScore | null {
  const { points, problemPoints, contest, scale } = input;
  if (!contest && !scale.contest)
    return { score: points, max: problemPoints, contestPrecision: null };
  if (!contest || scale.contest?.key !== contest.key) return null;
  const scored = scoreOnScale({ points, contest }, scale);
  return { ...scored, contestPrecision: scale.contest.precision };
}

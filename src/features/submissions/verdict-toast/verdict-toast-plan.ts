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

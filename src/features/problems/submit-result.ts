import type { SubmissionCase } from '@/api/types/submissions';
import { isFailed } from '@/features/submissions/test-overview';

/**
 * The test the result strip names after the verdict ("WA test 3"): the first failing test by position, or null when every
 * test passed or the viewer may not see the tests.
 */
export function firstFailedTest(cases: readonly SubmissionCase[] | null): number | null {
  const failed = (cases ?? []).filter(isFailed).map((testCase) => testCase.position);
  return failed.length ? Math.min(...failed) : null;
}

/**
 * What the strip's score is out of: the problem's points, or inside the viewer's contest the contest's (Q-10 A), written
 * with the contest's decimals.
 */
export interface ScoreScale {
  problemPoints: number;
  contest: { points: number; partial: boolean; precision: number } | null;
}

/**
 * A submission's points (on the problem's scale) on the strip's scale. In a contest the share of the problem's points
 * carries over to the contest's; a contest problem without partial scores pays only a full score.
 */
export function scoreOnScale(points: number, scale: ScoreScale): { score: number; max: number } {
  const { contest, problemPoints } = scale;
  if (!contest) return { score: points, max: problemPoints };
  const share = problemPoints > 0 ? points / problemPoints : 0;
  const counts = contest.partial || share >= 1;
  return { score: counts ? share * contest.points : 0, max: contest.points };
}

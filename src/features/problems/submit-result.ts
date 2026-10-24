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
 * What the strip's score is out of: the problem's points, or inside the viewer's contest the contest's, written
 * with the contest's decimals. The key tells the rail whether a row was submitted in that contest.
 */
export interface ScoreScale {
  problemPoints: number;
  contest: { key: string; points: number; partial: boolean; precision: number } | null;
}

/** The submission as the strip scores it: its points on the problem's scale and the contest it was made in. */
export interface ScoredSubmission {
  points: number;
  contest: { key: string; points: number | null } | null;
}

/**
 * A submission's score on the strip's scale. A submission made in the scale's contest shows the contest points the API gives
 * it, as the scoreboard counts them (a final-submission contest scores every problem partially). Otherwise, in a contest the
 * share of the problem's points carries over to the contest's, and a problem without partial scores pays only a full score.
 */
export function scoreOnScale(
  submission: ScoredSubmission,
  scale: ScoreScale,
): { score: number; max: number } {
  const { contest, problemPoints } = scale;
  const { points } = submission;
  if (!contest) return { score: points, max: problemPoints };
  const own = submission.contest?.key === contest.key ? submission.contest.points : null;
  if (own !== null) return { score: own, max: contest.points };
  const share = problemPoints > 0 ? points / problemPoints : 0;
  const counts = contest.partial || share >= 1;
  return { score: counts ? share * contest.points : 0, max: contest.points };
}

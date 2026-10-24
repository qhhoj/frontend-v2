import type { SubmissionListItem } from '@/api/types/submissions';
import type { ScoreScale } from './submit-result';

/** Decimals of a score whose scale carries none of its own: the submission page's. */
const SITE_DIGITS = 2;

/**
 * One rail row's score: `points` on the `scale` it is counted on, out of `max` (null where the row does not say what the
 * scale tops out at), written with `digits` decimals. `points` null is a score not given yet.
 */
export interface RailScore {
  scale: 'contest' | 'site';
  points: number | null;
  max: number | null;
  digits: number;
}

/**
 * A row's score on its own submission's scale: a submission made in a contest counts the contest's
 * points, as the scoreboard does; any other counts the problem's. The contest's maximum and decimals are known only for
 * the viewer's own contest, as the rail makes no request for another one. A contest that holds no points for the row
 * (the problem left it) leaves the problem's score, as the submission page does.
 */
export function railScore(
  submission: Pick<SubmissionListItem, 'points' | 'contest'>,
  scale: ScoreScale,
): RailScore {
  const { contest } = submission;
  const isUnjudged = submission.points === null;
  if (!contest || (contest.points === null && !isUnjudged))
    return {
      scale: 'site',
      points: submission.points,
      max: scale.problemPoints,
      digits: SITE_DIGITS,
    };
  const own = scale.contest?.key === contest.key ? scale.contest : null;
  return {
    scale: 'contest',
    points: isUnjudged ? null : contest.points,
    max: own?.points ?? null,
    digits: own?.precision ?? SITE_DIGITS,
  };
}

import type { ContestDetail } from '@/api/types/contests';
import { isFrozenAt } from '@/lib/contest-time';

/** Is the scoreboard closed to this viewer right now (backend `canSeeFullScoreboard`, approximated)? */
function isScoreboardHidden(contest: ContestDetail): boolean {
  if (contest.scoreboardVisibility === 'H') return true;
  return contest.scoreboardVisibility !== 'V' && contest.phase !== 'ended';
}

/**
 * Backend `canSeeFullSubmissionList`, approximated for the banner only (C8: the backend narrows the rows silently).
 * Replace with the viewer flag when backend ask B-8d1 lands.
 */
export function ownSubmissionsOnly(contest: ContestDetail, now: number): boolean {
  if (contest.viewer.canEdit) return false;
  if (isScoreboardHidden(contest) || isFrozenAt(contest, now)) return true;
  return contest.phase !== 'ended' && !contest.showSubmissionList;
}

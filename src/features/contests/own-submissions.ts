import type { ContestDetail } from '@/api/types/contests';
import { isFrozenAt } from '@/lib/contest-time';

/** Is the scoreboard closed to this viewer right now (backend `canSeeFullScoreboard`, approximated)? */
function isScoreboardHidden(contest: ContestDetail): boolean {
  if (contest.scoreboardVisibility === 'H') return true;
  return contest.scoreboardVisibility !== 'V' && contest.phase !== 'ended';
}

/**
 * Backend `canSeeFullSubmissionList`, approximated (C8: the backend narrows the rows silently): editors and curators
 * always see all, scoreboard viewers see a hidden board's list too.
 * Replace with the viewer flag when backend ask B-8d1 lands.
 */
export function ownSubmissionsOnly(contest: ContestDetail, now: number): boolean {
  const { canEdit, isEditor, canSeeFullScoreboard } = contest.viewer;
  if (canEdit || isEditor) return false;
  if ((!canSeeFullScoreboard && isScoreboardHidden(contest)) || isFrozenAt(contest, now))
    return true;
  return contest.phase !== 'ended' && !contest.showSubmissionList;
}

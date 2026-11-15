import type { ContestDetail } from '@/api/types/contests';
import { isFrozenAt, phaseAt } from '@/lib/contest-time';

/** The freeze chip's words: "Đóng băng" while the contest runs, "Chờ công bố" after it until the board is published. */
export interface BoardFreeze {
  labelKey: 'ranking.freeze.label' | 'ranking.freeze.pendingLabel';
  bodyKey: 'ranking.frozenBody' | 'ranking.awaitingPublish.body';
}

/**
 * Whether this viewer's board is frozen, and how to say it. `isBoardFrozen` is the board's own answer (the ranking tab
 * has it, polled); else the detail's `viewer.boardFrozenAt` (null for editors, who see the live board). While the contest
 * runs the clock also counts, so the chip appears at the freeze minute before the detail is read again.
 */
export function boardFreezeOf(
  contest: Pick<
    ContestDetail,
    'startTime' | 'endTime' | 'formatName' | 'frozenLastMinutes' | 'viewer'
  >,
  now: number,
  isBoardFrozen?: boolean,
): BoardFreeze | null {
  const phase = phaseAt(contest, now);
  const isFrozen =
    isBoardFrozen ??
    (contest.viewer.boardFrozenAt !== null ||
      (phase === 'running' && !contest.viewer.canEdit && isFrozenAt(contest, now)));
  if (!isFrozen) return null;
  return phase === 'ended'
    ? { labelKey: 'ranking.freeze.pendingLabel', bodyKey: 'ranking.awaitingPublish.body' }
    : { labelKey: 'ranking.freeze.label', bodyKey: 'ranking.frozenBody' };
}

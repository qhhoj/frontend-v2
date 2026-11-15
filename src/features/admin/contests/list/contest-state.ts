import type { EditableContest } from '@/api/types/contest-editing';
import type { ContestPhase } from '@/api/types/contests';
import { isFrozenAt } from '@/lib/contest-time';
import { serverNow } from '@/lib/server-clock';

/** What one contest is, in one word, for staff lists and headers. */
export type ContestState = 'draft' | 'upcoming' | 'running' | 'frozen' | 'ended';

export interface ContestStateInput {
  phase: ContestPhase;
  /** False while the contest is hidden from users; undefined when the viewer cannot tell (then it counts as shown). */
  isVisible?: boolean;
  /** True while the public board is frozen (see `isFrozenAt`); the list API does not carry it, so lists pass nothing. */
  isFrozen?: boolean;
}

/**
 * Draft is a hidden contest that has not started. A hidden contest that already runs or ended keeps its phase; the list shows
 * its "Đang ẩn" note beside it. Frozen is a running or ended contest whose public board is frozen.
 */
export function contestStateOf({ phase, isVisible, isFrozen }: ContestStateInput): ContestState {
  if (phase === 'upcoming') return isVisible === false ? 'draft' : 'upcoming';
  return isFrozen ? 'frozen' : phase;
}

/** The chip's inputs for an opened contest: its hidden flag (editors only) and whether the board is frozen while it runs. After the end it shows "ended": whether a frozen board was published is a separate fact (the Actions tab). */
export function editorStateInputOf(
  contest: EditableContest,
  now: number = serverNow(),
): ContestStateInput {
  return {
    phase: contest.phase,
    isVisible: contest.settings?.isVisible,
    isFrozen: contest.phase === 'running' && isFrozenAt(contest, now),
  };
}

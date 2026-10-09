import { ApiError } from '@/api/client';
import type { ContestDetail } from '@/api/types/contests';
import type { ReplayLoad } from '@/api/types/replay';
import { isBoardFrozen } from '@/lib/board-freeze';
import type { ReplayPanelState } from './replay-bits';

export type ReplayViewState = ReplayPanelState | 'loading' | 'ready';
export interface ReplayStateInput {
  contest: Pick<ContestDetail, 'phase' | 'formatName' | 'frozenLastMinutes'>;
  isPending: boolean;
  error: unknown;
  load: ReplayLoad | undefined;
}

/** Codes the gate answers with, by the panel they show (B5 Task 9 gate order). */
const PANEL_OF_CODE: Record<string, ReplayPanelState> = {
  replay_not_ready: 'notReady',
  contest_not_ended: 'notEnded',
  replay_unsupported: 'unsupported',
};

/** A 403 is the board gate: a freezing board says so, any other hidden board is plainly forbidden. */
function refusalState(error: unknown, contest: ReplayStateInput['contest']): ReplayPanelState {
  if (!(error instanceof ApiError)) return 'error';
  if (error.status === 403) return isBoardFrozen(contest) ? 'frozen' : 'forbidden';
  return PANEL_OF_CODE[error.code] ?? 'error';
}

/** What the replay page shows: the format and the phase are known before any request; a kept board outlives a failed refetch. */
export function replayViewState(input: ReplayStateInput): ReplayViewState {
  if (input.contest.formatName === 'final_submission') return 'unsupported';
  if (input.contest.phase !== 'ended') return 'notEnded';
  if (input.load?.state === 'ready') {
    const { participants, ghosts } = input.load.replay;
    return participants.length + ghosts.length === 0 ? 'empty' : 'ready';
  }
  if (input.error) return refusalState(input.error, input.contest);
  if (input.load?.state === 'building') return 'building';
  return 'loading';
}

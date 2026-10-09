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

/** The 403 reasons the backend names in `issues[0].code`. */
const PANEL_OF_FORBIDDEN_REASON: Record<string, ReplayPanelState> = {
  board_frozen: 'frozen',
  board_hidden: 'forbidden',
};

/** A 403 names its reason; without one, a freezing board reads as frozen and any other as hidden. */
function forbiddenState(error: ApiError, contest: ReplayStateInput['contest']): ReplayPanelState {
  const named = PANEL_OF_FORBIDDEN_REASON[error.issues[0]?.code ?? ''];
  return named ?? (isBoardFrozen(contest) ? 'frozen' : 'forbidden');
}

function refusalState(error: unknown, contest: ReplayStateInput['contest']): ReplayPanelState {
  if (!(error instanceof ApiError)) return 'error';
  if (error.status === 403) return forbiddenState(error, contest);
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

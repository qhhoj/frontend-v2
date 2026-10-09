import { ApiError } from '@/api/client';
import type { ContestDetail } from '@/api/types/contests';
import type { ReplayLoad } from '@/api/types/replay';
import { isBoardFrozen } from '@/lib/board-freeze';
import type { ReplayPanelState } from './replay-bits';

export type ReplayViewState = ReplayPanelState | 'loading' | 'ready';
export interface ReplayStateInput {
  contest: Pick<ContestDetail, 'phase' | 'formatName' | 'frozenLastMinutes'>;
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

/**
 * The answers that take a shown board away: 403 (frozen or hidden) and 404 (not ready). A 409 (`replay_changed`, a rebuild
 * during the read) is transient and keeps the board; 409 `contest_not_ended`/`replay_unsupported` cannot follow a ready
 * board. 401, 408, 429 and 5xx keep it too.
 */
const GATE_STATUSES = [403, 404];
/** The gate refused this viewer: it outranks a kept board, and polling stops (except for not-ready). */
export const isReplayRefusal = (error: unknown): error is ApiError =>
  error instanceof ApiError && GATE_STATUSES.includes(error.status);

function refusalState(error: unknown, contest: ReplayStateInput['contest']): ReplayPanelState {
  if (!(error instanceof ApiError)) return 'error';
  if (error.status === 403) return forbiddenState(error, contest);
  return PANEL_OF_CODE[error.code] ?? 'error';
}

/**
 * What the replay page shows: the format and the phase are known before any request. A refusal drops a kept board at once
 * (staff hid or re-froze it); only a network or server failure of a background read keeps the last ready board.
 */
export function replayViewState(input: ReplayStateInput): ReplayViewState {
  if (input.contest.formatName === 'final_submission') return 'unsupported';
  if (input.contest.phase !== 'ended') return 'notEnded';
  if (isReplayRefusal(input.error)) return refusalState(input.error, input.contest);
  if (input.load?.state === 'ready') {
    const { participants, ghosts } = input.load.replay;
    return participants.length + ghosts.length === 0 ? 'empty' : 'ready';
  }
  // A build in progress outlives a passing network or server failure: the page keeps polling it.
  if (input.load?.state === 'building') return 'building';
  if (input.error) return refusalState(input.error, input.contest);
  return 'loading';
}

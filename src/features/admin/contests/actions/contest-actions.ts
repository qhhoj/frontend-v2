import type {
  ContestActionState,
  ContestDataStatus,
  ContestFormatName,
} from '@/api/types/contest-editing';

/** Mirrors backend `FREEZE_FORMATS` (libs/contests contest-time): only these formats freeze their board. */
const FREEZE_FORMATS: readonly ContestFormatName[] = ['icpc', 'vnoj'];

/**
 * Mirrors backend `frozenTime`/`isFrozen`: a board is frozen only in a freezing format with a freeze window set. The backend
 * refuses rating while it is frozen, even after the contest has ended, until the window is set to 0.
 */
export const isBoardFrozen = (contest: {
  formatName: ContestFormatName;
  frozenLastMinutes: number;
}): boolean => FREEZE_FORMATS.includes(contest.formatName) && contest.frozenLastMinutes > 0;

export function canPrepareAgain(status: ContestDataStatus, now: number): boolean {
  if (status.state === 'preparing') return false;
  return status.nextPrepareAt === null || new Date(status.nextPrepareAt).getTime() <= now;
}

/** A queued or running action cannot be started again (the backend would queue a second job). */
export const isBusy = (state: ContestActionState): boolean => state !== 'idle';

import type { ContestActionState, ContestDataStatus } from '@/api/types/contest-editing';

export { isBoardFrozen } from '@/lib/board-freeze';

export function canPrepareAgain(status: ContestDataStatus, now: number): boolean {
  if (status.state === 'preparing') return false;
  return status.nextPrepareAt === null || new Date(status.nextPrepareAt).getTime() <= now;
}

/** A queued or running action cannot be started again (the backend would queue a second job). */
export const isBusy = (state: ContestActionState): boolean => state !== 'idle';

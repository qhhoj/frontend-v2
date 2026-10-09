import type { ContestActionState } from '@/api/types/contest-editing';

export { isBoardFrozen } from '@/lib/board-freeze';

/** The prepare-again rule of both data cards (contest data, submissions export): they share these two members. */
export function canPrepareAgain<T extends { state: string; nextPrepareAt: string | null }>(
  status: T,
  now: number,
): boolean {
  if (status.state === 'preparing') return false;
  return status.nextPrepareAt === null || new Date(status.nextPrepareAt).getTime() <= now;
}

/** A queued or running action cannot be started again (the backend would queue a second job). */
export const isBusy = (state: ContestActionState): boolean => state !== 'idle';

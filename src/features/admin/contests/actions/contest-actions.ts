import type { ContestActionState, ContestDataStatus } from '@/api/types/contest-editing';

const pad = (value: number) => String(value).padStart(2, '0');

/** `hh:mm:ss` until the contest ends; null once it has ended. */
export function timeLeftText(endTime: string, now: number): string | null {
  const seconds = Math.floor((new Date(endTime).getTime() - now) / 1000);
  if (seconds <= 0) return null;
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
}

export function canPrepareAgain(status: ContestDataStatus, now: number): boolean {
  if (status.state === 'preparing') return false;
  return status.nextPrepareAt === null || new Date(status.nextPrepareAt).getTime() <= now;
}

/** A queued or running action cannot be started again (the backend would queue a second job). */
export const isBusy = (state: ContestActionState): boolean => state !== 'idle';

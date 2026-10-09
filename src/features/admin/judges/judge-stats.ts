import type { Judge } from '@/api/types/judges-admin';

export const JUDGE_NAME_PATTERN = /^[\w.-]{1,50}$/;
export type JudgeStatus = 'online' | 'offline' | 'disabled' | 'blocked';

/** Blocked wins over disabled, disabled over online: a blocked judge may also be connected. */
export function judgeStatus(judge: Judge): JudgeStatus {
  if (judge.isBlocked) return 'blocked';
  if (judge.isDisabled) return 'disabled';
  return judge.online ? 'online' : 'offline';
}

/** The API gives the ping in seconds; the board shows whole milliseconds. */
export const pingMs = (ping: number | null) => (ping === null ? null : Math.round(ping * 1000));

const round2 = (value: number) => Math.round(value * 100) / 100;

function meanLoadOf(judges: Judge[]): number | null {
  const loads = judges
    .filter((judge) => judge.online && judge.load !== null)
    .map((judge) => judge.load!);
  if (loads.length === 0) return null;
  return round2(loads.reduce((sum, load) => sum + load, 0) / loads.length);
}

export function judgeStats(judges: Judge[]) {
  return {
    online: judges.filter((judge) => judge.online).length,
    total: judges.length,
    meanLoad: meanLoadOf(judges),
    blocked: judges.filter((judge) => judge.isBlocked).length,
    disabled: judges.filter((judge) => judge.isDisabled).length,
  };
}

export type JudgeStats = ReturnType<typeof judgeStats>;

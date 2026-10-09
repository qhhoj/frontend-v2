import type { ContestDetail } from '@/api/types/contests';

const MS_PER_SECOND = 1000;

/** How long one participation lasts on the replay clock: the window when set, else the contest's length, never before the last event. */
export function replayDurationSeconds(
  contest: Pick<ContestDetail, 'startTime' | 'endTime' | 'timeLimit'>,
  lastEventSeconds = 0,
): number {
  const contestSeconds = Math.floor(
    (Date.parse(contest.endTime) - Date.parse(contest.startTime)) / MS_PER_SECOND,
  );
  return Math.max(contest.timeLimit ?? contestSeconds, lastEventSeconds, 0);
}

/** `?t=` as whole seconds inside the replay; anything unreadable is the start, anything past the end is the end. */
export function parseReplaySeconds(raw: unknown, durationSeconds: number): number {
  const text = Array.isArray(raw) ? raw[0] : raw;
  if (typeof text !== 'string' || text.trim() === '') return 0;
  const seconds = Math.floor(Number(text));
  if (!Number.isFinite(seconds) || seconds < 0) return 0;
  return Math.min(seconds, durationSeconds);
}

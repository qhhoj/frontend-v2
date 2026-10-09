import type { FeedKeyStatus } from '@/api/types/contest-ops';
import { freezeStart, isFrozenAt } from '@/lib/contest-time';
import type { FreezeTimes } from '@/lib/contest-time';

/** backend `DEFAULT_FEED_KEY_DAYS`, `MAX_FEED_KEY_DAYS`. */
export const DEFAULT_FEED_KEY_DAYS = 14;
export const MAX_FEED_KEY_DAYS = 30;

export const isValidKeyDays = (days: number): boolean =>
  Number.isInteger(days) && days >= 1 && days <= MAX_FEED_KEY_DAYS;

/** A release made before the freeze in progress began does not count (backend: `releasedAt >= frozenTime`). */
function isReleasedForThisFreeze(status: FeedKeyStatus, contest: FreezeTimes): boolean {
  const from = freezeStart(contest);
  return status.releasedAt !== null && from !== null && Date.parse(status.releasedAt) >= from;
}

/** "Release to resolver" hands frozen results to the feed: an active frozen-until-release key, during a freeze, not yet released for it. */
export function canRelease(status: FeedKeyStatus, contest: FreezeTimes, now: number): boolean {
  if (!status.isActive || status.mode !== 'frozen-until-release') return false;
  return isFrozenAt(contest, now) && !isReleasedForThisFreeze(status, contest);
}

export const absoluteUrl = (path: string, origin: string): string => new URL(path, origin).href;

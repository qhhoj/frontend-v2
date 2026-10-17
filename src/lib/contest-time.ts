import type { ContestFormatName, ContestPhase } from '@/api/types/contests';
import { formatDuration } from './format';

/** Mirrors backend libs/contests/src/contest-time.ts; times are ISO strings, `now` is epoch ms. */
export interface ContestTimes {
  startTime: string;
  endTime: string;
}
export interface FreezeTimes extends ContestTimes {
  formatName: ContestFormatName;
  frozenLastMinutes: number;
}
export interface RegistrationWindow {
  registrationStart: string | null;
  registrationEnd: string | null;
}
export interface MessageRef {
  key: string;
  params: Record<string, number>;
  /** The plural count, for `t(key, params, count)`. */
  count?: number;
}

const MINUTE_MS = 60_000;
const FREEZE_FORMATS: readonly ContestFormatName[] = ['icpc', 'vnoj'];

/**
 * The phase from the clock, not from the server's `phase` field: the countdown reaches its
 * target before the server's answer changes, so the screens switch on this instead.
 */
export function phaseAt({ startTime, endTime }: ContestTimes, now: number): ContestPhase {
  if (now < Date.parse(startTime)) return 'upcoming';
  return now <= Date.parse(endTime) ? 'running' : 'ended';
}

export function contestProgress({ startTime, endTime }: ContestTimes, now: number): number {
  const start = Date.parse(startTime);
  const length = Date.parse(endTime) - start;
  if (length <= 0) return 1;
  return Math.min(1, Math.max(0, (now - start) / length));
}

/** Backend `frozenTime`: null when the board never freezes. */
export function freezeStart(contest: FreezeTimes): number | null {
  const freezes = FREEZE_FORMATS.includes(contest.formatName) && contest.frozenLastMinutes > 0;
  return freezes ? Date.parse(contest.endTime) - contest.frozenLastMinutes * MINUTE_MS : null;
}

export function freezeFraction(contest: FreezeTimes): number | null {
  const from = freezeStart(contest);
  return from === null ? null : contestProgress(contest, from);
}

/** Backend `isFrozen`: it stays frozen after the end until the freeze is set to 0. */
export function isFrozenAt(contest: FreezeTimes, now: number): boolean {
  const from = freezeStart(contest);
  return from !== null && now >= from;
}

/** Backend `requiresRegistration` and `isRegistrationOpen` (both bounds inclusive). */
export function registrationState(
  window: RegistrationWindow,
  now: number,
): 'none' | 'open' | 'closed' {
  const { registrationStart, registrationEnd } = window;
  if (registrationStart === null && registrationEnd === null) return 'none';
  const hasOpened = registrationStart === null || now >= Date.parse(registrationStart);
  const hasClosed = registrationEnd !== null && now > Date.parse(registrationEnd);
  return hasOpened && !hasClosed ? 'open' : 'closed';
}

/** What the big countdown counts to: the start, then the end, then nothing. */
export function countdownTarget(
  times: ContestTimes,
  now: number,
): { kind: 'start' | 'end'; at: string } | null {
  if (now < Date.parse(times.startTime)) return { kind: 'start', at: times.startTime };
  if (now <= Date.parse(times.endTime)) return { kind: 'end', at: times.endTime };
  return null;
}

const DAY_MS = 86_400_000;

/** Calendar days from the viewer-zone day of `from` to that of `to`: 0 the same day, 1 the next day (the `(+1)` label). */
export function localDayOffset(from: string, to: string): number {
  const dayOf = (iso: string) => {
    const date = new Date(iso);
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  };
  return Math.round((dayOf(to) - dayOf(from)) / DAY_MS);
}

/** A length in words (`2 giờ 30 phút`, `4 giờ`, `14 ngày`) as an i18n reference. */
export function spanMessage(seconds: number): MessageRef {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days >= 1) return { key: 'contests.span.days', params: { count: days }, count: days };
  if (hours > 0 && minutes > 0) {
    return { key: 'contests.span.hoursMinutes', params: { hours, minutes } };
  }
  if (hours > 0) return { key: 'contests.span.hours', params: { count: hours }, count: hours };
  if (minutes > 0) {
    return { key: 'contests.span.minutes', params: { count: minutes }, count: minutes };
  }
  return { key: 'contests.span.underMinute', params: {} };
}

/** From this many seconds left a countdown reads in days and hours: a clock past 48 hours is not read at a glance. */
export const LONG_COUNTDOWN_SECONDS = 48 * 3600;
export type CountdownView =
  { kind: 'clock'; text: string } | { kind: 'words'; days: number; hours: number };

/** Time left, said one way on the hero, the contest bar, the ranking pill and the list: `13 ngày 21 giờ`, then `HH:MM:SS`. */
export function countdownView(seconds: number): CountdownView {
  const left = Math.max(0, Math.floor(seconds));
  if (left < LONG_COUNTDOWN_SECONDS) return { kind: 'clock', text: formatDuration(left) };
  return {
    kind: 'words',
    days: Math.floor(left / 86_400),
    hours: Math.floor((left % 86_400) / 3600),
  };
}

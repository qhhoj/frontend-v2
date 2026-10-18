import type { Locale } from '@/i18n';
import { localDayOffset } from '@/lib/contest-time';
import { formatClock, formatDate } from '@/lib/format-date';

interface ContestTimes {
  startTime: string;
  endTime: string;
}

/** The end clock in the viewer's zone, with `(+N)` when it falls N days after the start's day (`01:00 (+1)`). */
export function endClockLabel(times: ContestTimes): string {
  const clock = formatClock(times.endTime);
  const dayOffset = localDayOffset(times.startTime, times.endTime);
  return dayOffset > 0 ? `${clock} (+${dayOffset})` : clock;
}

/** The contest starts and ends on the same day in the viewer's zone. */
export const isOneDay = (times: ContestTimes): boolean =>
  localDayOffset(times.startTime, times.endTime) === 0;

/**
 * The two ends of a timeline: clocks when the contest starts and ends on one day, else the full datetime of each end
 * (`15/10/2026 11:27` ─── `15/11/2026 11:27`), so two equal clocks on different days never read as one instant (P-18).
 */
export function timelineLabels(
  times: ContestTimes,
  locale: Locale,
): { start: string; end: string } {
  const label = (instant: string) =>
    isOneDay(times) ? formatClock(instant) : formatDate(instant, 'datetime', locale);
  return { start: label(times.startTime), end: label(times.endTime) };
}

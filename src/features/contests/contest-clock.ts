import type { Locale } from '@/i18n';
import { localDayOffset } from '@/lib/contest-time';
import { formatClock } from '@/lib/format';

/** The end clock in the viewer's zone, with `(+N)` when it falls N days after the start's day (`01:00 (+1)`). */
export function endClockLabel(
  times: { startTime: string; endTime: string },
  locale: Locale,
): string {
  const clock = formatClock(times.endTime, locale);
  const dayOffset = localDayOffset(times.startTime, times.endTime);
  return dayOffset > 0 ? `${clock} (+${dayOffset})` : clock;
}

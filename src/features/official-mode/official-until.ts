import { translate } from '@/i18n';
import type { Locale } from '@/i18n';
import { formatClock, formatDuration, formatShortDate } from '@/lib/format';

/** `H:MM:SS` left until the end; the pill's "còn 1:12:40". */
export const remainingText = (endsAt: string, nowMs: number): string =>
  formatDuration((new Date(endsAt).getTime() - nowMs) / 1000).replace(/^0/, '');

const isSameLocalDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

/** The viewer's own clock time of the end: "11:30 hôm nay", or "11:30 10/10" on another day. */
export function untilText(endsAt: string, nowMs: number, locale: Locale): string {
  const end = new Date(endsAt);
  const clock = formatClock(endsAt, locale);
  if (isSameLocalDay(end, new Date(nowMs))) return `${clock} ${translate('officialMode.today')}`;
  return `${clock} ${formatShortDate(endsAt, locale)}`;
}

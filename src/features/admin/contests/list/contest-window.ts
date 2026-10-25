import { serverNow } from '@/lib/server-clock';
import { SITE_TIME_ZONE, formatInZone } from '../../ui/form/site-time';

export interface ContestWindow {
  /** `dd/mm hh:mm` in the site zone, `dd/mm/yyyy hh:mm` outside the current year. */
  start: string;
  /** `hh:mm` when the contest ends on the day it starts, else the date too (as `start`). */
  end: string;
  /** The length, for `spanMessage`. */
  seconds: number;
}

/** `dd/mm/yyyy hh:mm` split into its day, year and clock. */
const partsOf = (iso: string, zone: string) => {
  const [date = '', clock = ''] = formatInZone(iso, zone).split(' ');
  return { day: date.slice(0, 5), year: date.slice(6), clock };
};

/**
 * A contest's start and end for one list line ("08/10 15:00 → 18:24"), in the site's time zone. The year shows only when
 * the start is not in the current year (`now`).
 */
export function contestWindowOf(
  startTime: string,
  endTime: string,
  now: number = serverNow(),
  zone: string = SITE_TIME_ZONE,
): ContestWindow {
  const start = partsOf(startTime, zone);
  const end = partsOf(endTime, zone);
  const thisYear = partsOf(new Date(now).toISOString(), zone).year;
  const dayText = (parts: typeof start) =>
    parts.year === thisYear ? parts.day : `${parts.day}/${parts.year}`;
  const isSameDay = start.day === end.day && start.year === end.year;
  return {
    start: `${dayText(start)} ${start.clock}`,
    end: isSameDay ? end.clock : `${dayText(end)} ${end.clock}`,
    seconds: Math.max(0, (Date.parse(endTime) - Date.parse(startTime)) / 1000),
  };
}

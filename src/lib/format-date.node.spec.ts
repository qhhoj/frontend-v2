import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatAgo,
  formatAgoCompact,
  formatClock,
  formatDate,
  formatDayKey,
  formatDayTile,
  formatMonthName,
  formatMonthYear,
  formatRelative,
  formatWeekdayDate,
  wallClockIn,
} from './format-date';

const inVietnam = () => vi.stubEnv('TZ', 'Asia/Ho_Chi_Minh');
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

/** 2025-12-31 17:30 UTC is already 01/01/2026 00:30 in Vietnam: the day, the month and the year all roll over. */
const NEW_YEAR_VIETNAM = '2025-12-31T17:30:00Z';
const MID_2026 = Date.parse('2026-06-15T05:00:00Z');

describe('formatDate presets', () => {
  it('writes dd/mm/yyyy, with a 24-hour clock for datetime, in the viewer time zone', () => {
    inVietnam();
    expect(formatDate('2026-10-08T13:12:09Z', 'date', 'vi')).toBe('08/10/2026');
    expect(formatDate('2026-10-08T13:12:09Z', 'datetime', 'vi')).toBe('08/10/2026 20:12');
    expect(formatDate('2026-10-08T13:12:09Z', 'datetimeSeconds', 'vi')).toBe('08/10/2026 20:12:09');
  });

  it('rolls the day, month and year over at the viewer midnight, not at UTC midnight', () => {
    inVietnam();
    expect(formatDate(NEW_YEAR_VIETNAM, 'date', 'vi')).toBe('01/01/2026');
    expect(formatDate(NEW_YEAR_VIETNAM, 'datetime', 'vi')).toBe('01/01/2026 00:30');
    expect(formatDate(NEW_YEAR_VIETNAM, 'datetimeSeconds', 'vi')).toBe('01/01/2026 00:30:00');
    vi.stubEnv('TZ', 'UTC');
    expect(formatDate(NEW_YEAR_VIETNAM, 'datetime', 'vi')).toBe('31/12/2025 17:30');
    expect(formatDate(NEW_YEAR_VIETNAM, 'datetimeSeconds', 'vi')).toBe('31/12/2025 17:30:00');
    vi.stubEnv('TZ', 'America/Los_Angeles');
    expect(formatDate(NEW_YEAR_VIETNAM, 'datetime', 'vi')).toBe('31/12/2025 09:30');
  });

  it('shows midnight as 00:00, never 24:00', () => {
    inVietnam();
    expect(formatDate('2026-10-08T17:00:00Z', 'datetime', 'vi')).toBe('09/10/2026 00:00');
  });

  it('follows the locale for the order of day and month and keeps the 24-hour clock', () => {
    inVietnam();
    expect(formatDate('2026-10-08T13:12:09Z', 'date', 'en')).toBe('10/08/2026');
    expect(formatDate('2026-10-08T13:12:09Z', 'datetime', 'en')).toBe('10/08/2026 20:12');
    expect(formatDate('2026-10-08T13:12:09Z', 'short', 'en', { now: MID_2026 })).toBe('10/08');
  });

  it('formats in the zone the caller names instead of the viewer one', () => {
    vi.stubEnv('TZ', 'America/Los_Angeles');
    const options = { timeZone: 'Asia/Ho_Chi_Minh' };
    expect(formatDate(NEW_YEAR_VIETNAM, 'datetime', 'vi', options)).toBe('01/01/2026 00:30');
  });

  it('takes an instant as an ISO string, a millisecond count or a Date', () => {
    inVietnam();
    const instant = Date.parse('2026-10-08T13:12:09Z');
    expect(formatDate(instant, 'datetime', 'vi')).toBe('08/10/2026 20:12');
    expect(formatDate(new Date(instant), 'datetime', 'vi')).toBe('08/10/2026 20:12');
  });
});

describe('formatDate short', () => {
  it('drops the year for a date in the current year', () => {
    inVietnam();
    expect(formatDate('2026-10-08T13:12:09Z', 'short', 'vi', { now: MID_2026 })).toBe('08/10');
  });

  it('keeps the year for any other year, so an old day never reads as this year', () => {
    inVietnam();
    expect(formatDate('2025-10-08T13:12:09Z', 'short', 'vi', { now: MID_2026 })).toBe('08/10/2025');
    expect(formatDate('2027-02-01T00:00:00Z', 'short', 'vi', { now: MID_2026 })).toBe('01/02/2027');
  });

  it('judges the year across New Year in the viewer zone, for the date and for now alike', () => {
    inVietnam();
    const beforeNewYear = Date.parse('2025-12-31T16:00:00Z'); // 31/12/2025 23:00 in Vietnam
    const afterNewYear = Date.parse('2025-12-31T18:00:00Z'); // 01/01/2026 01:00 in Vietnam
    expect(formatDate(NEW_YEAR_VIETNAM, 'short', 'vi', { now: beforeNewYear })).toBe('01/01/2026');
    expect(formatDate(NEW_YEAR_VIETNAM, 'short', 'vi', { now: afterNewYear })).toBe('01/01');
    expect(formatDate(beforeNewYear, 'short', 'vi', { now: afterNewYear })).toBe('31/12/2025');
  });

  it('takes the real clock as now when none is given', () => {
    inVietnam();
    vi.useFakeTimers({ now: MID_2026 });
    expect(formatDate('2026-03-02T00:00:00Z', 'short', 'vi')).toBe('02/03');
    expect(formatDate('2025-03-02T00:00:00Z', 'short', 'vi')).toBe('02/03/2025');
  });
});

describe('formatClock', () => {
  it('writes the 24-hour time of day, with seconds on request', () => {
    inVietnam();
    expect(formatClock('2026-10-08T13:12:09Z')).toBe('20:12');
    expect(formatClock('2026-10-08T13:12:09Z', { seconds: true })).toBe('20:12:09');
    expect(formatClock('2026-10-08T17:00:00Z')).toBe('00:00');
  });

  it('reads the time in the zone the caller names', () => {
    vi.stubEnv('TZ', 'UTC');
    expect(formatClock('2026-10-08T13:12:09Z', { timeZone: 'Asia/Ho_Chi_Minh' })).toBe('20:12');
  });

  it('shows the local clock, so a late-evening contest keeps its own day', () => {
    // 18:00Z on Oct 10 is 01:00 on Oct 11 in Vietnam.
    inVietnam();
    expect(formatClock('2026-10-10T18:00:00Z')).toBe('01:00');
    vi.stubEnv('TZ', 'UTC');
    expect(formatClock('2026-10-10T18:00:00Z')).toBe('18:00');
  });
});

describe('formatDayTile', () => {
  const OCTOBER_2026 = Date.parse('2026-10-08T09:37:07Z');

  it('splits the viewer day into the day number and the short month, without the current year', () => {
    inVietnam();
    // 18:00Z on Oct 10 is 01:00 on Oct 11 in Vietnam.
    const start = '2026-10-10T18:00:00Z';
    expect(formatDayTile(start, 'vi', OCTOBER_2026)).toEqual({
      day: '11',
      month: 'thg 10',
      year: null,
    });
    expect(formatDayTile(start, 'en', OCTOBER_2026)).toEqual({
      day: '11',
      month: 'Oct',
      year: null,
    });
    vi.stubEnv('TZ', 'UTC');
    expect(formatDayTile(start, 'vi', OCTOBER_2026).day).toBe('10');
  });

  it('adds the year once the day is not in the current year, as the short date does', () => {
    inVietnam();
    expect(formatDayTile('2027-01-05T03:00:00Z', 'vi', OCTOBER_2026)).toEqual({
      day: '5',
      month: 'thg 1',
      year: '2027',
    });
    // 17:30Z on 31/12 is already 01/01 in Vietnam: the tile is 2026, so it shows the year until the viewer's own midnight.
    const beforeNewYear = Date.parse('2025-12-31T16:00:00Z');
    const afterNewYear = Date.parse('2025-12-31T18:00:00Z');
    expect(formatDayTile(NEW_YEAR_VIETNAM, 'vi', beforeNewYear).year).toBe('2026');
    expect(formatDayTile(NEW_YEAR_VIETNAM, 'vi', afterNewYear).year).toBeNull();
  });
});

describe('wallClockIn', () => {
  it('reads every field of the wall clock in the given zone, across a year boundary', () => {
    expect(wallClockIn(NEW_YEAR_VIETNAM, 'Asia/Ho_Chi_Minh')).toEqual({
      year: 2026,
      month: 1,
      day: 1,
      hour: 0,
      minute: 30,
      second: 0,
    });
    expect(wallClockIn(NEW_YEAR_VIETNAM, 'UTC').year).toBe(2025);
  });
});

describe('formatDayKey', () => {
  it('names the calendar day in the zone, so the key rolls over at that zone midnight', () => {
    expect(formatDayKey(NEW_YEAR_VIETNAM, 'Asia/Ho_Chi_Minh')).toBe('2026-01-01');
    expect(formatDayKey(NEW_YEAR_VIETNAM, 'UTC')).toBe('2025-12-31');
    inVietnam();
    expect(formatDayKey(NEW_YEAR_VIETNAM)).toBe('2026-01-01');
  });
});

describe('the weekday and the axis labels', () => {
  it('spells the weekday of the viewer day before the date', () => {
    inVietnam();
    expect(formatWeekdayDate('2026-10-08T13:12:09Z', 'vi')).toBe('Thứ Năm, 08/10/2026');
    expect(formatWeekdayDate('2026-10-08T13:12:09Z', 'en')).toBe('Thursday, 10/08/2026');
    expect(formatWeekdayDate('2026-10-08T17:30:00Z', 'vi')).toBe('Thứ Sáu, 09/10/2026');
  });

  it('writes a month and a two-digit year as 09/25', () => {
    inVietnam();
    expect(formatMonthYear('2025-09-20T10:00:00Z')).toBe('09/25');
    expect(formatMonthYear(NEW_YEAR_VIETNAM)).toBe('01/26');
  });

  it('names a calendar month in the locale', () => {
    expect(formatMonthName(2026, 10, 'vi')).toBe('Tháng 10');
    expect(formatMonthName(2026, 10, 'en')).toBe('October');
  });
});

describe('relative times', () => {
  it('formats past dates relative to now', () => {
    const now = Date.parse('2026-10-08T10:00:00Z');
    expect(formatRelative('2026-10-08T09:58:00Z', now, 'en')).toBe('2 minutes ago');
    expect(formatRelative('2026-10-08T07:00:00Z', now, 'vi')).toBe('3 giờ trước');
  });

  it('reads a time a few seconds ahead of the clock as now, and a real future time as the future', () => {
    const now = Date.parse('2026-10-08T10:00:00Z');
    expect(formatRelative('2026-10-08T10:00:04Z', now, 'vi')).toBe('bây giờ');
    expect(formatRelative('2026-10-08T10:00:04Z', now, 'en')).toBe('now');
    expect(formatRelative('2026-10-08T10:05:00Z', now, 'en')).toBe('in 5 minutes');
  });

  it('writes a compact age: a number and a unit within a week, the short date after', () => {
    const now = Date.parse('2026-10-08T10:00:00Z');
    expect(formatAgoCompact('2026-10-08T09:58:30Z', now, 'vi')).toBe('1 phút');
    expect(formatAgoCompact('2026-10-08T07:00:00Z', now, 'vi')).toBe('3 giờ');
    expect(formatAgoCompact('2026-10-08T07:00:00Z', now, 'en')).toBe('3h');
    expect(formatAgoCompact('2026-10-08T09:59:50Z', now, 'en')).toBe('10s');
    expect(formatAgoCompact('2026-10-05T10:00:00Z', now, 'vi')).toBe('3 ngày');
    expect(formatAgoCompact('2026-09-20T10:00:00Z', now, 'vi')).toBe('20/09');
    expect(formatAgoCompact('2026-10-08T10:00:05Z', now, 'vi')).toBe('0 giây');
  });

  it('gives the year to a compact age that falls in an earlier year', () => {
    const now = Date.parse('2026-01-03T10:00:00Z');
    expect(formatAgoCompact('2025-12-20T10:00:00Z', now, 'vi')).toBe('20/12/2025');
  });

  describe('formatAgo', () => {
    const now = Date.parse('2026-10-08T12:00:00Z');
    it('is relative under a week and a date after', () => {
      expect(formatAgo('2026-10-08T10:00:00Z', now, 'vi')).toBe('2 giờ trước');
      expect(formatAgo('2026-10-01T12:00:01Z', now, 'en')).toBe('7 days ago');
      expect(formatAgo('2026-09-30T12:00:00Z', now, 'vi')).toBe('30/09/2026');
    });
    it('still says "ago" at exactly seven days and shows the date one second further back', () => {
      expect(formatAgo('2026-10-01T12:00:00Z', now, 'en')).toBe('7 days ago');
      expect(formatAgo('2026-10-01T11:59:59Z', now, 'en')).toBe('10/01/2026');
    });
  });
});

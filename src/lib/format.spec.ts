import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  coinIndex,
  formatAgo,
  formatNumericDate,
  formatNumericDateTime,
  formatNumericDateTimeSeconds,
  formatCaseMemory,
  formatCaseTime,
  formatClock,
  formatDate,
  formatDateTime,
  formatDayMonth,
  formatDuration,
  formatElapsed,
  formatElapsedSeconds,
  formatFileSize,
  formatMemoryLimit,
  formatFixed,
  formatNumber,
  formatShortDate,
  formatWeekdayDate,
  formatRelative,
  signedScore,
  greetingKey,
  formatTimeLimit,
  initials,
} from './format';

describe('format helpers', () => {
  it('formats a countdown with unbounded hours and never below zero', () => {
    expect(formatDuration(5077)).toBe('01:24:37');
    expect(formatDuration(14 * 86_400 - 1)).toBe('335:59:59');
    expect(formatDuration(-5)).toBe('00:00:00');
  });

  it('formats ranking times as H:MM from the start', () => {
    expect(formatElapsed(31 * 60 + 59)).toBe('0:31');
    expect(formatElapsed(2 * 3600 + 5 * 60)).toBe('2:05');
  });

  it('formats numbers per locale', () => {
    expect(formatNumber(386.4, 'vi', 1)).toBe('386,4');
    expect(formatNumber(386.4, 'en', 1)).toBe('386.4');
  });

  it('formats a number with exactly the given decimals, per locale', () => {
    expect(formatFixed(100, 'vi', 1)).toBe('100,0');
    expect(formatFixed(100, 'en', 1)).toBe('100.0');
    expect(formatFixed(386.4, 'vi', 2)).toBe('386,40');
    expect(formatFixed(7, 'en', 0)).toBe('7');
  });

  it('formats past dates relative to now', () => {
    const now = Date.parse('2026-10-08T10:00:00Z');
    expect(formatRelative('2026-10-08T09:58:00Z', now, 'en')).toBe('2 minutes ago');
    expect(formatRelative('2026-10-08T07:00:00Z', now, 'vi')).toBe('3 giờ trước');
  });

  it('greets by the time of day', () => {
    expect(greetingKey(5)).toBe('home.greeting.morning');
    expect(greetingKey(11)).toBe('home.greeting.afternoon');
    expect(greetingKey(18)).toBe('home.greeting.evening');
    expect(greetingKey(2)).toBe('home.greeting.evening');
  });

  it('takes the initials of the first two words', () => {
    expect(initials('Dãy con tăng dài nhất')).toBe('DC');
    expect(initials('  đường ')).toBe('Đ');
  });

  it('spreads the fixture codes over at least three of the six coins', () => {
    const seeds = ['aplusb', 'lis', 'knapsack2', 'fibo', 'lcs', 'dpbitree'];
    const coins = seeds.map(coinIndex);
    expect(coins.every((coin) => Number.isInteger(coin) && coin >= 0 && coin < 6)).toBe(true);
    expect(new Set(coins).size).toBeGreaterThanOrEqual(3);
  });
});

describe('limits', () => {
  it('formats the time limit with one decimal and memory in MB from KiB', () => {
    expect(formatTimeLimit(1)).toBe('1.0s');
    expect(formatTimeLimit(0.25)).toBe('0.25s');
    expect(formatMemoryLimit(262144)).toBe('256MB');
    expect(formatMemoryLimit(1536)).toBe('1.5MB');
  });
  it('formats a case with two decimals and MB with one', () => {
    expect(formatCaseTime(0.014)).toBe('0.01s');
    expect(formatCaseMemory(3277)).toBe('3.2 MB');
  });
  it('formats an upload size in MB above 1 MB (floored) and whole KB below', () => {
    expect(formatFileSize(1_887_437)).toBe('1.8 MB');
    expect(formatFileSize(655_360)).toBe('640 KB');
    expect(formatFileSize(0)).toBe('0 KB');
  });
});
describe('formatDateTime', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('shows the instant in the viewer time zone, not UTC', () => {
    vi.stubEnv('TZ', 'Asia/Ho_Chi_Minh');
    expect(formatDateTime('2026-10-08T07:05:00Z', 'en')).toBe('Oct 8, 2026, 2:05 PM');
    vi.stubEnv('TZ', 'America/Los_Angeles');
    expect(formatDateTime('2026-10-08T07:05:00Z', 'en')).toBe('Oct 8, 2026, 12:05 AM');
  });
});
describe('formatDate', () => {
  it('shows the UTC calendar date in the locale, whatever the machine time zone is', () => {
    expect(formatDate('2026-10-08T23:30:00Z', 'en')).toBe('Oct 8, 2026');
    expect(formatDate('2026-10-08T23:30:00Z', 'vi')).toContain('2026');
    expect(formatDate('2026-10-08T23:30:00Z', 'vi')).toContain('8');
  });
});

describe('contest instants in the viewer time zone', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('shows the local clock and day, so a late-evening contest keeps its own day', () => {
    vi.stubEnv('TZ', 'Asia/Ho_Chi_Minh');
    // 18:00Z on Oct 10 is 01:00 on Oct 11 in Vietnam.
    expect(formatClock('2026-10-10T18:00:00Z', 'vi')).toBe('01:00');
    expect(formatDayMonth('2026-10-10T18:00:00Z', 'vi')).toEqual({ day: '11', month: 'thg 10' });
    expect(formatDayMonth('2026-10-10T18:00:00Z', 'en')).toEqual({ day: '11', month: 'Oct' });
    expect(formatShortDate('2026-10-10T18:00:00Z', 'vi')).toBe('11/10');
    expect(formatShortDate('2026-10-10T18:00:00Z', 'en')).toBe('10/11');
    vi.stubEnv('TZ', 'UTC');
    expect(formatClock('2026-10-10T18:00:00Z', 'vi')).toBe('18:00');
    expect(formatDayMonth('2026-10-10T18:00:00Z', 'vi').day).toBe('10');
  });
  it('writes the weekday and full date for the detail line', () => {
    vi.stubEnv('TZ', 'Asia/Ho_Chi_Minh');
    expect(formatWeekdayDate('2026-10-08T06:00:00Z', 'vi')).toBe('Thứ Năm, 08/10/2026');
  });
});

describe('formatElapsedSeconds', () => {
  it('prints H:MM:SS from the contest start', () => {
    expect(formatElapsedSeconds(492)).toBe('0:08:12');
    expect(formatElapsedSeconds(17_607)).toBe('4:53:27');
    expect(formatElapsedSeconds(-3)).toBe('0:00:00');
  });
});

describe('numeric dates in the viewer zone', () => {
  it('writes day/month/year in Vietnamese and month/day/year in English', () => {
    expect(formatNumericDate('2026-10-08T20:12:00Z', 'vi')).toBe('08/10/2026');
    expect(formatNumericDate('2026-10-08T20:12:00Z', 'en')).toBe('10/08/2026');
    expect(formatNumericDateTime('2026-10-08T20:12:00Z', 'vi')).toBe('08/10/2026 20:12');
  });
});
describe('formatAgo', () => {
  const now = Date.parse('2026-10-08T12:00:00Z');
  it('is relative under a week and a date after', () => {
    expect(formatAgo('2026-10-08T10:00:00Z', now, 'vi')).toBe('2 giờ trước');
    expect(formatAgo('2026-10-01T12:00:01Z', now, 'en')).toBe('7 days ago');
    expect(formatAgo('2026-09-30T12:00:00Z', now, 'vi')).toMatch(/^\d\d\/\d\d\/2026$/);
  });
  it('still says "ago" at exactly seven days and shows the date one second further back', () => {
    expect(formatAgo('2026-10-01T12:00:00Z', now, 'en')).toBe('7 days ago');
    expect(formatAgo('2026-10-01T11:59:59Z', now, 'en')).toBe('10/01/2026');
  });
});

describe('signedScore', () => {
  it('writes the sign of a vote score with a real minus', () => {
    expect([signedScore(4), signedScore(-3), signedScore(0)]).toEqual(['+4', '\u22123', '0']);
  });
});

describe('formatNumericDateTimeSeconds', () => {
  it('writes the numeric date and a 24-hour time with seconds, per locale', () => {
    expect(formatNumericDateTimeSeconds('2026-10-08T08:41:08.000Z', 'vi')).toBe(
      '08/10/2026 08:41:08',
    );
    expect(formatNumericDateTimeSeconds('2026-10-08T20:05:09.000Z', 'en')).toBe(
      '10/08/2026 20:05:09',
    );
  });
});

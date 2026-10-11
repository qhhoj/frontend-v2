import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatProblemPoints,
  formatAgo,
  formatClock,
  formatDateTime,
  formatDayMonth,
  formatDuration,
  formatShortDate,
  formatRelative,
  formatAgoCompact,
} from './format';

describe('format helpers', () => {
  it('formats a countdown with unbounded hours and never below zero', () => {
    expect(formatDuration(5077)).toBe('01:24:37');
    expect(formatDuration(14 * 86_400 - 1)).toBe('335:59:59');
    expect(formatDuration(-5)).toBe('00:00:00');
  });

  it('marks partially scored problems with a p suffix, as 1500p', () => {
    expect(formatProblemPoints(1500, true, 'vi')).toBe('1500p');
    expect(formatProblemPoints(1500, false, 'vi')).toBe('1500');
    expect(formatProblemPoints(12.5, true, 'vi')).toBe('12,5p');
    expect(formatProblemPoints(12.5, true, 'en')).toBe('12.5p');
  });

  it('formats past dates relative to now', () => {
    const now = Date.parse('2026-10-08T10:00:00Z');
    expect(formatRelative('2026-10-08T09:58:00Z', now, 'en')).toBe('2 minutes ago');
    expect(formatRelative('2026-10-08T07:00:00Z', now, 'vi')).toBe('3 giờ trước');
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

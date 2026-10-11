import { describe, expect, it } from 'vitest';
import {
  activityFilterFromQuery,
  dailyBars,
  dayStartIds,
  shortIp,
  toActivityRequest,
} from './activity';

describe('activity helpers', () => {
  it('reads the filter from the URL and falls back to 7 days', () => {
    expect(activityFilterFromQuery({ user: 'tuan_k', days: '30' })).toEqual({
      user: 'tuan_k',
      ip: '',
      path: '',
      days: 30,
    });
    expect(activityFilterFromQuery({ days: '45' }).days).toBe(7);
  });

  it('sends only filled fields', () => {
    expect(toActivityRequest({ user: '', ip: '27.69', path: '', days: 7 })).toEqual({
      ip: '27.69',
      days: 7,
    });
  });

  it('scales bars to the busiest day and keeps small non-zero days visible', () => {
    const bars = dailyBars(
      [
        { day: '2026-10-07', count: 1 },
        { day: '2026-10-08', count: 200 },
        { day: '2026-10-09', count: 0 },
      ],
      30,
      40,
    );
    expect(bars.map((bar) => bar.height)).toEqual([1, 40, 0]);
    expect(bars.map((bar) => bar.x)).toEqual([0, 10, 20]);
    expect(bars[1]!.label).toBe('2026-10-08: 200');
  });
});

describe('shortIp', () => {
  it('keeps the first four groups of a full IPv6 address and marks the cut', () => {
    expect(shortIp('2405:4802:6efc:f980:2e0:4cff:fe36:5677')).toBe('2405:4802:6efc:f980:…');
  });
  it('leaves IPv4 and already short addresses whole', () => {
    expect(shortIp('203.0.113.7')).toBe('203.0.113.7');
    expect(shortIp('2001:db8::1')).toBe('2001:db8::1');
  });
});

describe('dayStartIds', () => {
  it('marks the first row and each row whose day differs from the one before', () => {
    const rows = [
      { id: 'a', at: '2026-10-11T10:00' },
      { id: 'b', at: '2026-10-11T09:00' },
      { id: 'c', at: '2026-10-10T23:00' },
    ];
    expect([...dayStartIds(rows, (at) => at.slice(0, 10))]).toEqual(['a', 'c']);
  });
});

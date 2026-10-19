import { afterEach, describe, expect, it, vi } from 'vitest';
import { meterPercent, nextMonthStart } from './quota';

describe('quota helpers', () => {
  it('treats a zero limit as full once anything is used', () => {
    expect(meterPercent({ used: 0, limit: 0 })).toEqual({ percent: 0, barPercent: 0 });
    expect(meterPercent({ used: 3, limit: 0 })).toEqual({ percent: 100, barPercent: 100 });
  });
});

describe('nextMonthStart', () => {
  afterEach(() => vi.useRealTimers());
  const today = (iso: string) => vi.useFakeTimers({ now: Date.parse(iso), toFake: ['Date'] });

  it('is the first of the following month, day first in Vietnamese and month first in English', () => {
    today('2026-10-19T00:00:00Z');
    expect(nextMonthStart('2026-10', 'vi')).toBe('01/11');
    expect(nextMonthStart('2026-10', 'en')).toBe('11/01');
  });

  it('adds the year when the reset falls in the next year', () => {
    today('2026-12-15T00:00:00Z');
    expect(nextMonthStart('2026-12', 'vi')).toBe('01/01/2027');
    expect(nextMonthStart('2026-12', 'en')).toBe('01/01/2027');
  });
});

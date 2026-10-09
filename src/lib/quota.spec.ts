import { describe, expect, it } from 'vitest';
import { formatMebibytes, meterPercent, monthLabel, nextMonthStart } from './quota';

describe('quota helpers', () => {
  it('formats bytes as MiB with at most one decimal in the viewer’s locale', () => {
    expect(formatMebibytes(410 * 1024 * 1024, 'vi')).toBe('410 MiB');
    expect(formatMebibytes(1.5 * 1024 * 1024, 'vi')).toBe('1,5 MiB');
    expect(formatMebibytes(1.5 * 1024 * 1024, 'en')).toBe('1.5 MiB');
  });

  it('rounds the meter percentage down and caps the bar, but reports the overage', () => {
    expect(meterPercent({ used: 164, limit: 200 })).toEqual({ percent: 82, barPercent: 82 });
    expect(meterPercent({ used: 799, limit: 1000 })).toEqual({ percent: 79, barPercent: 79 });
    expect(meterPercent({ used: 250, limit: 200 })).toEqual({ percent: 125, barPercent: 100 });
  });

  it('treats a zero limit as full once anything is used', () => {
    expect(meterPercent({ used: 0, limit: 0 })).toEqual({ percent: 0, barPercent: 0 });
    expect(meterPercent({ used: 3, limit: 0 })).toEqual({ percent: 100, barPercent: 100 });
  });

  it('names the month from the key, never from the browser clock', () => {
    expect(monthLabel('2026-10', 'vi')).toContain('10');
    expect(monthLabel('2026-01', 'en')).toBe('January');
  });

  it('names the first day of the month after the usage month, across a year end', () => {
    expect(nextMonthStart('2026-10')).toBe('01/11');
    expect(nextMonthStart('2026-12')).toBe('01/01');
  });
});

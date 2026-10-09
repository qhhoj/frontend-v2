import { describe, expect, it } from 'vitest';
import { activityFilterFromQuery, dailyBars, toActivityRequest } from './activity';

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

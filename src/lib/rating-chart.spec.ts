import { describe, expect, it } from 'vitest';
import type { RatingHistoryEntry } from '@/api/types/users';
import { chartPoints, ratedHistory } from './rating-chart';

const entry = (
  endTime: string,
  rating: number | null,
  contestName: string | null = 'Round',
): RatingHistoryEntry => ({
  contestKey: contestName ? 'r' : null,
  contestName,
  endTime,
  rating,
  rank: 1,
  performance: 1500,
});

describe('rating chart model', () => {
  it('keeps rated entries only, oldest first (the API order is not promised)', () => {
    const history = [
      entry('2026-09-01T00:00:00Z', 1500),
      entry('2026-08-01T00:00:00Z', 1400),
      entry('2026-10-01T00:00:00Z', null, null),
    ];
    expect(ratedHistory(history).map((item) => item.rating)).toEqual([1400, 1500]);
  });
  it('places the highest rating highest and spreads contests evenly, one contest in the middle', () => {
    const box = { width: 600, height: 200, left: 20, right: 20, top: 20, bottom: 20 };
    const points = chartPoints(
      [entry('2026-08-01T00:00:00Z', 1400), entry('2026-09-01T00:00:00Z', 1600)],
      box,
    );
    expect(points[1]!.y).toBeLessThan(points[0]!.y);
    expect([points[0]!.x, points[1]!.x]).toEqual([225, 375]);
    expect(chartPoints([entry('2026-08-01T00:00:00Z', 1400)], box)[0]!.x).toBe(300);
  });
});

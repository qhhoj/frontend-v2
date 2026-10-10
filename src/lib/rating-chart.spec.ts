import { describe, expect, it } from 'vitest';
import type { RatingHistoryEntry } from '@/api/types/users';
import {
  chartPoints,
  labelEvery,
  ratedHistory,
  ratingLabelTicks,
  ratingRange,
  ratingTicks,
  tierBands,
} from './rating-chart';

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
  it('pads the range by at least 100 and rounds it to hundreds, with one tick per hundred', () => {
    expect(ratingRange([1200, 1546, 1487])).toEqual({ low: 1100, high: 1700 });
    expect(ratingTicks({ low: 1100, high: 1700 })).toEqual([
      1100, 1200, 1300, 1400, 1500, 1600, 1700,
    ]);
  });
  it('places the highest rating highest and spreads contests evenly, one contest in the middle', () => {
    const box = { width: 600, height: 200, padding: 20 };
    const points = chartPoints(
      [entry('2026-08-01T00:00:00Z', 1400), entry('2026-09-01T00:00:00Z', 1600)],
      box,
    );
    expect(points[1]!.y).toBeLessThan(points[0]!.y);
    expect([points[0]!.x, points[1]!.x]).toEqual([20, 580]);
    expect(chartPoints([entry('2026-08-01T00:00:00Z', 1400)], box)[0]!.x).toBe(300);
  });
  it('cuts the tier bands to the range, each band coloured by its tier', () => {
    expect(tierBands({ low: 1100, high: 1700 })).toEqual([
      { color: 'newbie', low: 1100, high: 1200 },
      { color: 'pupil', low: 1200, high: 1400 },
      { color: 'specialist', low: 1400, high: 1600 },
      { color: 'expert', low: 1600, high: 1700 },
    ]);
  });
});

describe('chart label spacing', () => {
  it('keeps rating labels at least 18 units apart over a wide range', () => {
    const ticks = ratingLabelTicks({ low: 700, high: 3100 }, 156);
    expect(ticks.length).toBeLessThanOrEqual(8);
    expect(ticks.every((tick) => tick % 100 === 0)).toBe(true);
  });
  it('labels every contest of a short history and thins a long one out', () => {
    expect(labelEvery(5, 576)).toBe(1);
    expect(labelEvery(60, 576)).toBe(5);
  });
});

import { describe, expect, it } from 'vitest';
import type { RatingHistoryEntry } from '@/api/types/users';
import { recentContests } from './recent-contests';

const entry = (
  day: number,
  rating: number | null,
  name: string | null = `Round ${day}`,
): RatingHistoryEntry => ({
  contestKey: name && `r${day}`,
  contestName: name,
  endTime: `2026-09-${String(day).padStart(2, '0')}T10:00:00Z`,
  rating,
  rank: day,
  performance: rating && rating + 50,
});

describe('recentContests', () => {
  it('lists the newest first with the change since the previous rated contest', () => {
    const rows = recentContests([entry(1, 1400), entry(10, 1455), entry(5, 1431)], 5);
    expect(rows.map((row) => [row.name, row.delta])).toEqual([
      ['Round 10', 24],
      ['Round 5', 31],
      ['Round 1', null],
    ]);
  });
  it('keeps a hidden contest as a row without numbers and skips it when computing the next change', () => {
    const rows = recentContests([entry(1, 1400), entry(2, null, null), entry(3, 1450)], 5);
    expect(rows[1]).toEqual({
      key: null,
      name: null,
      rank: 2,
      performance: null,
      rating: null,
      delta: null,
    });
    expect(rows[0]!.delta).toBe(50);
  });
  it('cuts the list to the count', () => {
    expect(recentContests([entry(1, 1), entry(2, 2), entry(3, 3)], 2)).toHaveLength(2);
  });
});

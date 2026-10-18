import { describe, expect, it } from 'vitest';
import { ariaSortOf, nextSort, stickyOffsets } from './DataTableColumns';

describe('stickyOffsets', () => {
  it('puts each pinned column right after the ones before it', () => {
    expect(stickyOffsets([40, 120, 60])).toEqual([0, 40, 160]);
    expect(stickyOffsets([])).toEqual([]);
  });
});

describe('nextSort', () => {
  const byName = { asc: 'name', desc: '-name' };
  const byPoints = { asc: 'points', desc: '-points', first: 'desc' as const, clears: true };
  const rating = { desc: 'rating' };

  it('starts in the first direction and flips between the two', () => {
    expect(nextSort(byName, undefined)).toBe('name');
    expect(nextSort(byName, 'name')).toBe('-name');
    expect(nextSort(byName, '-name')).toBe('name');
  });

  it('returns to no sort after both directions when the column clears', () => {
    expect(nextSort(byPoints, undefined)).toBe('-points');
    expect(nextSort(byPoints, '-points')).toBe('points');
    expect(nextSort(byPoints, 'points')).toBeUndefined();
  });

  it('keeps a one-way column on its only direction', () => {
    expect(nextSort(rating, undefined)).toBe('rating');
    expect(nextSort(rating, 'rating')).toBe('rating');
    expect(ariaSortOf(rating, 'rating')).toBe('descending');
    expect(ariaSortOf(rating, 'points')).toBeUndefined();
  });
});

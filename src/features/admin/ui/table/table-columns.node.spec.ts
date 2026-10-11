import { describe, expect, it } from 'vitest';
import { ariaSortOf, nextSort, rangeOf } from './table-columns';

const byName = { asc: 'name', desc: '-name' };
const byDate = { asc: 'oldest', desc: 'newest', first: 'desc' as const };

describe('column sort', () => {
  it('starts in the column’s first direction, then flips', () => {
    expect(nextSort(byName, 'newest')).toBe('name');
    expect(nextSort(byName, 'name')).toBe('-name');
    expect(nextSort(byName, '-name')).toBe('name');
    expect(nextSort(byDate, undefined)).toBe('newest');
    expect(nextSort(byDate, 'newest')).toBe('oldest');
  });

  it('reports aria-sort only for the active column', () => {
    expect(ariaSortOf(byDate, 'newest')).toBe('descending');
    expect(ariaSortOf(byDate, 'oldest')).toBe('ascending');
    expect(ariaSortOf(byName, 'newest')).toBeUndefined();
    expect(ariaSortOf(undefined, 'newest')).toBeUndefined();
  });
});

describe('rangeOf', () => {
  it('counts the rows shown on a page', () => {
    expect(rangeOf(1, 50, 50, 312)).toEqual({ from: 1, to: 50, total: 312 });
    expect(rangeOf(7, 50, 12, 312)).toEqual({ from: 301, to: 312, total: 312 });
    expect(rangeOf(1, 50, 0, 0)).toEqual({ from: 0, to: 0, total: 0 });
  });
});

import { describe, expect, it } from 'vitest';
import {
  boardColumns,
  rankLocation,
  rowAnchor,
  sortFromQuery,
  sortLocation,
} from './leaderboard-columns';

describe('leaderboard columns', () => {
  it('shows the four user numbers on the user boards and marks the sorted one', () => {
    const columns = boardColumns('points');
    expect(columns.map((column) => column.key)).toEqual([
      'rating',
      'performancePoints',
      'points',
      'problemCount',
    ]);
    expect(columns.filter((column) => column.isActive).map((column) => column.key)).toEqual([
      'points',
    ]);
  });
});

describe('leaderboard routing', () => {
  it('reads a known sort from the URL and falls back to rating', () => {
    expect(sortFromQuery('points')).toBe('points');
    expect(sortFromQuery('contributors')).toBe('rating');
    expect(sortFromQuery('bogus')).toBe('rating');
    expect(sortFromQuery(undefined)).toBe('rating');
  });

  it('sorts to the first page, leaving the default sort out of the URL', () => {
    expect(sortLocation('points')).toEqual({ query: { sort: 'points' } });
    expect(sortLocation('rating')).toEqual({ query: {} });
  });

  it('anchors a row by username', () => {
    expect(rowAnchor('khoa.tran')).toBe('user-khoa.tran');
  });

  it('locates a row on its page, keeping the sort and leaving out the defaults', () => {
    expect(rankLocation('points', 12, 'user_01')).toEqual({
      query: { sort: 'points', page: '12' },
      hash: '#user-user_01',
    });
    expect(rankLocation('rating', 1, 'user_01')).toEqual({ query: {}, hash: '#user-user_01' });
  });
});

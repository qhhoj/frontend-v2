import { describe, expect, it } from 'vitest';
import {
  boardColumns,
  rankFieldOf,
  rankLocation,
  rowAnchor,
  sortFromQuery,
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

  it('shows only contribution points on the contributors board', () => {
    expect(boardColumns('contributors')).toEqual([
      {
        key: 'contributionPoints',
        labelKey: 'leaderboard.columns.contributionPoints',
        isActive: true,
      },
    ]);
  });

  it('asks the rank of the field the board is sorted by', () => {
    expect(rankFieldOf('contributors')).toBe('contributionPoints');
    expect(rankFieldOf('problemCount')).toBe('problemCount');
  });
});

describe('leaderboard routing', () => {
  it('reads a known sort from the URL and falls back to rating', () => {
    expect(sortFromQuery('contributors')).toBe('contributors');
    expect(sortFromQuery('bogus')).toBe('rating');
    expect(sortFromQuery(undefined)).toBe('rating');
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

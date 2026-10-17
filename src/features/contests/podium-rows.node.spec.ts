import { describe, expect, it } from 'vitest';
import { rankingRow } from '@/test/fixtures';
import { PODIUM_LIMIT, podiumRows } from './podium-rows';

const row = (
  rank: number | null,
  username: string,
  extra: { virtual?: number; isDisqualified?: boolean } = {},
) => ({
  ...rankingRow(rank ?? 0, `part-${username}`, username, 1, 0, {}),
  rank,
  virtual: extra.virtual ?? 0,
  isDisqualified: extra.isDisqualified ?? false,
});
const placesOf = (rows: ReturnType<typeof row>[]) =>
  podiumRows(rows).map((place) => [place.user.username, place.rank]);

describe('podiumRows', () => {
  it('keeps the live board as it is: ranks 1-3 with ties, and no invented rank after a tie', () => {
    expect(
      placesOf([row(1, 'user_01'), row(1, 'user_02'), row(3, 'user_03'), row(4, 'user_04')]),
    ).toEqual([
      ['user_01', 1],
      ['user_02', 1],
      ['user_03', 3],
    ]);
  });

  it('leaves virtual rows off and ranks the live rows among themselves', () => {
    expect(
      placesOf([
        row(1, 'user_09', { virtual: 1 }),
        row(2, 'user_01'),
        row(3, 'user_02'),
        row(3, 'user_08', { virtual: 2 }),
        row(5, 'user_03'),
        row(6, 'user_04'),
      ]),
    ).toEqual([
      ['user_01', 1],
      ['user_02', 2],
      ['user_03', 3],
    ]);
  });

  it('keeps a live tie that a virtual row shares as one place', () => {
    expect(
      placesOf([
        row(1, 'user_09', { virtual: 1 }),
        row(1, 'user_01'),
        row(1, 'user_02'),
        row(4, 'user_03'),
        row(5, 'user_04'),
      ]),
    ).toEqual([
      ['user_01', 1],
      ['user_02', 1],
      ['user_03', 3],
    ]);
  });

  it('skips disqualified and unranked rows', () => {
    expect(
      placesOf([
        row(1, 'user_01'),
        row(2, 'user_02'),
        row(null, 'user_05'),
        row(null, 'user_06', { isDisqualified: true }),
      ]),
    ).toEqual([
      ['user_01', 1],
      ['user_02', 2],
    ]);
  });

  it('caps a mass tie', () => {
    const tied = Array.from({ length: 9 }, (_unused, index) => row(1, `user_${10 + index}`));
    expect(podiumRows(tied)).toHaveLength(PODIUM_LIMIT);
  });
});

import { LEADERBOARD_SORTS } from '@/api/types/users';
import type { LeaderboardSort } from '@/api/types/users';

export interface BoardColumn {
  key: LeaderboardSort;
  labelKey: string;
  isActive: boolean;
}

/** The number columns of the board, each a sort; the one the board is sorted by is active. */
export const boardColumns = (sort: LeaderboardSort): BoardColumn[] =>
  LEADERBOARD_SORTS.map((key) => ({
    key,
    labelKey: `leaderboard.columns.${key}`,
    isActive: key === sort,
  }));

export const sortFromQuery = (value: unknown): LeaderboardSort =>
  LEADERBOARD_SORTS.includes(value as LeaderboardSort) ? (value as LeaderboardSort) : 'rating';

/** Sorting by a column opens its first page; the default sort is left out of the URL. */
export const sortLocation = (sort: LeaderboardSort) => ({
  query: sort === 'rating' ? {} : { sort },
});

export const rowAnchor = (username: string) => `user-${username}`;

/** Where "find my rank" lands: the page that holds the row, the sort kept, defaults left out of the URL. */
export function rankLocation(sort: LeaderboardSort, page: number, username: string) {
  return {
    query: {
      ...(sort === 'rating' ? {} : { sort }),
      ...(page > 1 ? { page: String(page) } : {}),
    },
    hash: `#${rowAnchor(username)}`,
  };
}

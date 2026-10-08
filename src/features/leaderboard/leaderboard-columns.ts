import { BOARD_SORTS, LEADERBOARD_SORTS } from '@/api/types/users';
import type { BoardSort, RankField } from '@/api/types/users';

export interface BoardColumn {
  key: RankField;
  labelKey: string;
  isActive: boolean;
}

/** The number columns of a board: the four user numbers, or contribution points alone. */
export function boardColumns(sort: BoardSort): BoardColumn[] {
  const keys: RankField[] =
    sort === 'contributors' ? ['contributionPoints'] : [...LEADERBOARD_SORTS];
  return keys.map((key) => ({
    key,
    labelKey: `leaderboard.columns.${key}`,
    isActive: key === rankFieldOf(sort),
  }));
}

export const rankFieldOf = (sort: BoardSort): RankField =>
  sort === 'contributors' ? 'contributionPoints' : sort;

export const sortFromQuery = (value: unknown): BoardSort =>
  BOARD_SORTS.includes(value as BoardSort) ? (value as BoardSort) : 'rating';

export const rowAnchor = (username: string) => `user-${username}`;

/** Where "find my rank" lands: the page that holds the row, the sort kept, defaults left out of the URL. */
export function rankLocation(sort: BoardSort, page: number, username: string) {
  return {
    query: {
      ...(sort === 'rating' ? {} : { sort }),
      ...(page > 1 ? { page: String(page) } : {}),
    },
    hash: `#${rowAnchor(username)}`,
  };
}

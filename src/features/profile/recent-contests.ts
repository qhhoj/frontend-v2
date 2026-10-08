import type { RatingHistoryEntry } from '@/api/types/users';

export interface RecentContestRow {
  key: string | null;
  name: string | null;
  rank: number | null;
  performance: number | null;
  rating: number | null;
  /** Change since the previous rated contest; null for the first one and for hidden rows. */
  delta: number | null;
}

/** The newest `count` contests, each with its rating change. */
export function recentContests(history: RatingHistoryEntry[], count: number): RecentContestRow[] {
  const oldestFirst = [...history].sort(
    (left, right) => Date.parse(left.endTime) - Date.parse(right.endTime),
  );
  let previous: number | null = null;
  const rows = oldestFirst.map((entry): RecentContestRow => {
    const delta = entry.rating !== null && previous !== null ? entry.rating - previous : null;
    if (entry.rating !== null) previous = entry.rating;
    return {
      key: entry.contestKey,
      name: entry.contestName,
      rank: entry.rank,
      performance: entry.performance,
      rating: entry.rating,
      delta,
    };
  });
  return rows.reverse().slice(0, count);
}

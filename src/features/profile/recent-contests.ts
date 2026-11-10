import type { RatingHistoryEntry } from '@/api/types/users';
import type { DataTableColumn } from '@/components/ui/DataTableColumns';
import { translate } from '@/i18n';

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

/** The columns of the profile's recent-contests table; the overview's skeleton draws the same ones. */
export const recentContestColumns = (): DataTableColumn[] => [
  { key: 'name', label: translate('profile.columns.contest'), priority: 'primary' },
  { key: 'rank', label: translate('profile.columns.rank'), align: 'end' },
  { key: 'performance', label: translate('profile.columns.performance'), align: 'end' },
  { key: 'rating', label: translate('profile.columns.rating'), align: 'end' },
  { key: 'delta', label: translate('profile.columns.delta'), align: 'end' },
];

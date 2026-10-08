import { describe, expect, it } from 'vitest';
import { leaderboardEntry } from '@/test/fixtures';
import { mountComponent } from '@/test/mount';
import LeaderboardTable from './LeaderboardTable.vue';
import LeaderboardTableSkeleton from './LeaderboardTableSkeleton.vue';
import { AVATAR_PX } from './leaderboard-cells';
import type { BoardSort } from '@/api/types/users';

const cellClasses = (row: HTMLElement) =>
  Array.from(row.querySelectorAll('td'), (cell: HTMLTableCellElement) =>
    cell.getAttribute('class'),
  );

describe('leaderboard skeleton parity', () => {
  for (const sort of ['rating', 'contributors'] as BoardSort[]) {
    it(`gives a skeleton row the same row and cell classes as a loaded row on the ${sort} board`, () => {
      const table = mountComponent(LeaderboardTable, {
        props: { entries: [leaderboardEntry(1, 'user_01', 1500)], sort, viewerName: null },
      });
      const skeleton = mountComponent(LeaderboardTableSkeleton, { props: { sort } });
      const loadedRow = table.get('tbody tr').element as HTMLElement;
      const skeletonRow = skeleton.get('tbody tr').element as HTMLElement;
      expect(skeletonRow.getAttribute('class')).toBe(loadedRow.getAttribute('class'));
      expect(cellClasses(skeletonRow)).toEqual(cellClasses(loadedRow));
    });
  }

  it('draws the avatar at the same pixel size as a loaded row', () => {
    const table = mountComponent(LeaderboardTable, {
      props: { entries: [leaderboardEntry(1, 'user_01', 1500)], sort: 'rating', viewerName: null },
    });
    const skeleton = mountComponent(LeaderboardTableSkeleton, { props: { sort: 'rating' } });
    expect(table.get('tbody svg').attributes('width')).toBe(String(AVATAR_PX));
    expect(skeleton.find('tbody .size-7').exists()).toBe(true);
    expect(AVATAR_PX).toBe(28);
  });
});

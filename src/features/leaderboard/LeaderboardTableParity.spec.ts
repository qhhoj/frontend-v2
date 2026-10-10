import { describe, expect, it } from 'vitest';
import type { VueWrapper } from '@vue/test-utils';
import { leaderboardEntry } from '@/test/fixtures';
import { mountComponent } from '@/test/mount';
import LeaderboardTable from './LeaderboardTable.vue';
import LeaderboardTableSkeleton from './LeaderboardTableSkeleton.vue';

// Literal class strings, written out here on purpose: the spec must fail when a shared class changes.
const HEAD = 'text-left text-[12px] font-semibold tracking-wide text-muted uppercase';
const ROW = 'border-t border-line target:bg-accent-soft';
const RANK_CELL = 'px-3 py-2.5 text-right font-mono tabular-nums';
const USER_CELL = 'overflow-hidden px-3 py-2.5';
const ORGANIZATION_CELL = 'hidden truncate px-3 py-2.5 text-muted md:table-cell';
const VALUE_CELL_ACTIVE = `${RANK_CELL} font-bold text-positive`;
const RANK_HEAD = 'w-14 px-3 py-2 text-right';
const USER_HEAD = 'px-3 py-2';
const ORGANIZATION_HEAD = 'hidden w-28 px-3 py-2 md:table-cell';
const VALUE_HEAD_ACTIVE = 'w-28 text-right whitespace-nowrap text-content';
const VALUE_HEAD = 'w-28 text-right whitespace-nowrap';
const HEAD_INNER = 'flex min-h-11 w-full items-center justify-end gap-1 px-2';

const HEADS = [
  RANK_HEAD,
  USER_HEAD,
  ORGANIZATION_HEAD,
  VALUE_HEAD_ACTIVE,
  VALUE_HEAD,
  VALUE_HEAD,
  VALUE_HEAD,
];
const CELLS = [
  RANK_CELL,
  USER_CELL,
  ORGANIZATION_CELL,
  VALUE_CELL_ACTIVE,
  RANK_CELL,
  RANK_CELL,
  RANK_CELL,
];

/** The first body row's cells, read from the DOM; the component's own constants are not consulted. */
const cellClasses = (wrapper: VueWrapper) =>
  wrapper
    .findAll('tbody tr')[0]!
    .findAll('td')
    .map((cell) => cell.attributes('class'));
const headClasses = (wrapper: VueWrapper) =>
  wrapper.findAll('thead th').map((cell) => cell.attributes('class'));

describe('leaderboard skeleton parity', () => {
  {
    const sort = 'rating';
    it('draws the board and its skeleton with the literal header, row and cell classes', () => {
      const table = mountComponent(LeaderboardTable, {
        props: { entries: [leaderboardEntry(1, 'user_01', 1500)], sort, viewerName: null },
      });
      const skeleton = mountComponent(LeaderboardTableSkeleton, { props: { sort } });
      for (const wrapper of [table, skeleton]) {
        expect(wrapper.get('thead').attributes('class')).toBe(HEAD);
        expect(headClasses(wrapper)).toEqual(HEADS);
        expect(wrapper.get('tbody tr').attributes('class')).toBe(ROW);
        expect(cellClasses(wrapper)).toEqual(CELLS);
        const inner = wrapper
          .findAll('thead th')
          .slice(3)
          .map((cell) => cell.get('button, div'));
        expect(inner.map((node) => node.attributes('class')?.startsWith(HEAD_INNER))).toEqual([
          true,
          true,
          true,
          true,
        ]);
      }
    });
  }

  it('draws the avatar at 28 px on a loaded row and as a size-7 block in the skeleton', () => {
    const table = mountComponent(LeaderboardTable, {
      props: { entries: [leaderboardEntry(1, 'user_01', 1500)], sort: 'rating', viewerName: null },
    });
    const skeleton = mountComponent(LeaderboardTableSkeleton, { props: { sort: 'rating' } });
    expect(table.get('tbody svg').attributes('width')).toBe('28');
    expect(skeleton.find('tbody .size-7').exists()).toBe(true);
  });

  it('keeps the skeleton to one viewport of rows, not a page of 100', () => {
    const skeleton = mountComponent(LeaderboardTableSkeleton, { props: { sort: 'rating' } });
    expect(skeleton.findAll('tbody tr')).toHaveLength(12);
  });

  it('gives the table a floor that leaves the user column 12rem beside the columns', () => {
    const table = mountComponent(LeaderboardTable, {
      props: { entries: [leaderboardEntry(1, 'user_01', 1500)], sort: 'rating', viewerName: null },
    });
    const classes = table.get('table').classes();
    // 56 + 4 x 112 (numbers) + 192 = 696 px = 43.5rem; with the 112 px organization 808 px = 50.5rem.
    expect(classes).toContain('min-w-[43.5rem]');
    expect(classes).toContain('md:min-w-[50.5rem]');
    expect(table.get('[role="region"]').attributes('tabindex')).toBe('0');
  });
});

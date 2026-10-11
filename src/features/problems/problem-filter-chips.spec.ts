import { describe, expect, it } from 'vitest';
import { filterChips } from './problem-filter-chips';
import { NO_FILTERS } from './use-problem-filters';

const catalog = {
  types: [
    { id: 't1', name: 'dp', fullName: 'Quy hoạch động' },
    { id: 't2', name: 'greedy', fullName: 'Tham lam' },
  ],
  groups: [{ id: 'g1', name: 'voi', fullName: 'VOI' }],
};

describe('active filter chips', () => {
  it('has one chip per picked type and per other filter, each clearing only itself', () => {
    const filters = {
      ...NO_FILTERS,
      typeIds: ['t1', 't2'],
      groupId: 'g1',
      pointsMin: 800,
      pointsMax: 2400,
      hideSolved: true,
    };
    const chips = filterChips(filters, catalog);
    expect(chips.map((chip) => chip.label)).toEqual([
      'VOI',
      'Quy hoạch động',
      'Tham lam',
      '800–2400 điểm',
      'Ẩn bài đã giải',
    ]);
    expect(chips[1]!.clear).toEqual({ typeIds: ['t2'] });
    expect(chips[3]!.clear).toEqual({ pointsMin: null, pointsMax: null });
  });
});

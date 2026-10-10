import { describe, expect, it } from 'vitest';
import { polygonProblem } from '@/test/admin-fixtures/polygon';
import { cardBlockOf, filterCounts, filterProblems } from './pick-filter';

const withState = (state: 'READY' | 'RUNNING' | 'FAILED' | 'NONE', id = 1) =>
  polygonProblem({
    id,
    name: `bai-${id}`,
    title: null,
    owner: 'thu.tran',
    latestPackage: { id: null, revision: null, state },
  });

describe('cardBlockOf', () => {
  it.each([
    ['READY', null],
    ['RUNNING', 'running'],
    ['FAILED', 'failed'],
    ['NONE', 'noPackage'],
  ] as const)('a newest package %s blocks with %s', (state, block) => {
    expect(cardBlockOf(withState(state))).toBe(block);
  });

  it('blocks a linked problem even when its package is READY', () => {
    expect(cardBlockOf(polygonProblem({ linkedProblemCode: 'dem_cap' }))).toBe('linked');
  });

  it('lets a problem with uncommitted changes through: its READY package still imports', () => {
    expect(cardBlockOf(polygonProblem({ modified: true }))).toBe(null);
  });
});

describe('filterProblems', () => {
  const problems = [
    polygonProblem({ id: 1, name: 'xau-doi-xung', title: 'Xâu đối xứng', owner: 'lamter' }),
    polygonProblem({ id: 2, name: 'chia-keo', title: null, owner: 'khoa.ng' }),
    withState('RUNNING', 3),
    withState('FAILED', 4),
    withState('NONE', 5),
  ];

  it('matches the id, the name, the title or the owner in any case', () => {
    const ids = (search: string) =>
      filterProblems(problems, search, 'all').map((problem) => problem.id);
    expect(ids('XÂU')).toEqual([1]);
    expect(ids('chia')).toEqual([2]);
    expect(ids('KHOA')).toEqual([2]);
    expect(ids('2')).toEqual([2]);
    expect(ids('  ')).toEqual([1, 2, 3, 4, 5]);
  });

  it('counts each chip for the current search; failed and no package share one chip', () => {
    expect(filterCounts(problems, '')).toEqual({ all: 5, ready: 2, running: 1, unavailable: 2 });
    expect(filterCounts(problems, 'thu.tran')).toEqual({
      all: 3,
      ready: 0,
      running: 1,
      unavailable: 2,
    });
  });
});

import { describe, expect, it } from 'vitest';
import { parseSubmissionFilters, withPatch } from './use-submission-filters';
import {
  ERROR_RESULTS,
  advancedFilterCount,
  isQuickFilterOn,
  quickFilterPatch,
} from './quick-filters';
import type { QuickFilter } from './quick-filters';

const filtersOf = (query: Record<string, string | string[]> = {}) => parseSubmissionFilters(query);
const click = (query: Record<string, string | string[]>, chip: QuickFilter, me: string | null) => {
  const filters = filtersOf(query);
  return withPatch(filters, quickFilterPatch(filters, chip, me));
};

describe('quick filters', () => {
  it('lights the chips a shared URL stands for', () => {
    const mine = filtersOf({ user: 'alice', result: 'AC', waiting: 'grading' });
    expect(isQuickFilterOn(mine, 'mine', 'alice')).toBe(true);
    expect(isQuickFilterOn(mine, 'mine', 'bob')).toBe(false);
    expect(isQuickFilterOn(mine, 'mine', null)).toBe(false);
    expect(isQuickFilterOn(mine, 'accepted', 'alice')).toBe(true);
    expect(isQuickFilterOn(mine, 'errors', 'alice')).toBe(false);
    expect(isQuickFilterOn(mine, 'grading', 'alice')).toBe(true);
    expect(
      isQuickFilterOn(filtersOf({ result: [...ERROR_RESULTS].reverse() }), 'errors', null),
    ).toBe(true);
    expect(isQuickFilterOn(filtersOf({ result: ['AC', 'WA'] }), 'accepted', null)).toBe(false);
  });

  it('sets the viewer as the user, and clears it on the second click', () => {
    expect(click({}, 'mine', 'alice').user).toBe('alice');
    expect(click({ user: 'alice' }, 'mine', 'alice').user).toBe('');
    expect(click({ user: 'bob' }, 'mine', 'alice').user).toBe('alice');
  });

  it('switches between AC and the error results, and off again', () => {
    expect(click({}, 'accepted', null).results).toEqual(['AC']);
    expect(click({ result: 'AC' }, 'errors', null).results).toEqual(ERROR_RESULTS);
    expect(click({ result: [...ERROR_RESULTS] }, 'errors', null).results).toEqual([]);
    expect(click({ result: 'AC' }, 'accepted', null).results).toEqual([]);
  });

  it('adds and removes the grading group without touching the contest final group', () => {
    expect(click({ waiting: 'final' }, 'grading', null).statusGroups).toEqual(['final', 'grading']);
    expect(click({ waiting: ['final', 'grading'] }, 'grading', null).statusGroups).toEqual([
      'final',
    ]);
  });

  it('starts again at page 1 after a chip click', () => {
    expect(click({ page: '4' }, 'accepted', null).page).toBe(1);
  });

  it('counts the filters only the advanced panel shows', () => {
    expect(advancedFilterCount(filtersOf(), 'alice')).toBe(0);
    expect(advancedFilterCount(filtersOf({ user: 'alice', result: 'AC' }), 'alice')).toBe(0);
    expect(
      advancedFilterCount(filtersOf({ user: 'bob', problem: 'aplusb', result: 'TLE' }), 'alice'),
    ).toBe(3);
  });
});

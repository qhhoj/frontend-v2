import { describe, expect, it } from 'vitest';
import {
  NO_FILTERS,
  panelFilterCount,
  parseProblemFilters,
  toApiFilters,
  toProblemQuery,
} from './use-problem-filters';

const TYPE_ID = '0192a000-0000-7000-8000-0000000000d1';
const GROUP_ID = '0192a000-0000-7000-8000-0000000000c1';
const V4_ID = '3f2b8c1e-5d4a-4b7e-9c1d-2a6f8e0b4c11';

describe('problem filters in the URL', () => {
  it('drops values the API would refuse', () => {
    expect(
      parseProblemFilters({
        group: V4_ID,
        type: ['nope', V4_ID, TYPE_ID],
        min: 'abc',
        max: '1e9',
        unsolved: 'yes',
        sort: 'bogus',
      }),
    ).toEqual({ ...NO_FILTERS, typeIds: [TYPE_ID] });
  });

  it('round-trips through the URL query', () => {
    const filters = {
      search: 'dp',
      groupId: GROUP_ID,
      typeIds: [TYPE_ID],
      pointsMin: 800,
      pointsMax: 2400,
      hideSolved: true,
      hasEditorial: true,
      sort: 'acRate' as const,
    };
    // The router writes every value as text.
    const query = Object.fromEntries(
      Object.entries(toProblemQuery(filters))
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, Array.isArray(value) ? value.map(String) : String(value)]),
    );
    expect(parseProblemFilters(query)).toEqual(filters);
  });

  it('asks the API for unsolved problems only when hiding solved ones', () => {
    expect(toApiFilters(NO_FILTERS).solved).toBeUndefined();
    expect(toApiFilters({ ...NO_FILTERS, hideSolved: true }).solved).toBe(false);
    expect(toApiFilters({ ...NO_FILTERS, hasEditorial: true }).hasEditorial).toBe(true);
  });
});

describe('panelFilterCount', () => {
  it('ignores search and sort, which stay outside the phone filter panel', () => {
    expect(panelFilterCount({ ...NO_FILTERS, search: 'sum', sort: 'points' })).toBe(0);
  });

  it('counts each narrowing filter once, a points range as one', () => {
    expect(
      panelFilterCount({
        ...NO_FILTERS,
        groupId: GROUP_ID,
        typeIds: [TYPE_ID, V4_ID],
        pointsMin: 100,
        pointsMax: 800,
        hideSolved: true,
        hasEditorial: true,
      }),
    ).toBe(5);
    expect(panelFilterCount({ ...NO_FILTERS, pointsMax: 800 })).toBe(1);
  });
});

import { describe, expect, it } from 'vitest';
import {
  NO_FILTERS,
  parseProblemFilters,
  toApiFilters,
  toProblemQuery,
} from './use-problem-filters';

const TYPE_ID = '0192a000-0000-7000-8000-0000000000d1';
const GROUP_ID = '0192a000-0000-7000-8000-0000000000c1';
const V4_ID = '3f2b8c1e-5d4a-4b7e-9c1d-2a6f8e0b4c11';

describe('problem filters in the URL', () => {
  it('reads every filter', () => {
    expect(
      parseProblemFilters({
        search: 'lis',
        group: GROUP_ID,
        type: [TYPE_ID],
        min: '800',
        max: '3500',
        unsolved: '1',
        editorial: '1',
        sort: '-points',
      }),
    ).toEqual({
      search: 'lis',
      groupId: GROUP_ID,
      typeIds: [TYPE_ID],
      pointsMin: 800,
      pointsMax: 3500,
      hideSolved: true,
      hasEditorial: true,
      sort: '-points',
    });
  });

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

  it('accepts a single type as a plain value', () => {
    expect(parseProblemFilters({ type: TYPE_ID }).typeIds).toEqual([TYPE_ID]);
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

  it('writes only the filters that are set', () => {
    expect(toProblemQuery({ ...NO_FILTERS, pointsMax: 3500 })).toEqual({
      search: undefined,
      group: undefined,
      type: undefined,
      min: undefined,
      max: 3500,
      unsolved: undefined,
      editorial: undefined,
      sort: undefined,
    });
  });

  it('asks the API for unsolved problems only when hiding solved ones', () => {
    expect(toApiFilters(NO_FILTERS).solved).toBeUndefined();
    expect(toApiFilters({ ...NO_FILTERS, hideSolved: true }).solved).toBe(false);
    expect(toApiFilters({ ...NO_FILTERS, hasEditorial: true }).hasEditorial).toBe(true);
  });
});

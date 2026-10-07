import { describe, expect, it } from 'vitest';
import { parseProblemFilters, toProblemQuery } from './use-problem-filters';

const TYPE_ID = '0192a000-0000-7000-8000-0000000000d1';
const V4_ID = '3f2b8c1e-5d4a-4b7e-9c1d-2a6f8e0b4c11';

describe('problem filters in the URL', () => {
  it('reads every filter', () => {
    expect(
      parseProblemFilters({
        search: 'lis',
        type: [TYPE_ID],
        min: '800',
        max: '3500',
        sort: '-points',
      }),
    ).toEqual({
      search: 'lis',
      typeIds: [TYPE_ID],
      pointsMin: 800,
      pointsMax: 3500,
      sort: '-points',
    });
  });

  it('drops values the API would refuse', () => {
    expect(
      parseProblemFilters({
        type: ['nope', V4_ID, TYPE_ID],
        min: 'abc',
        max: '1e9',
        sort: 'bogus',
      }),
    ).toEqual({
      search: '',
      typeIds: [TYPE_ID],
      pointsMin: null,
      pointsMax: null,
      sort: null,
    });
  });

  it('accepts a single type as a plain value', () => {
    expect(parseProblemFilters({ type: TYPE_ID }).typeIds).toEqual([TYPE_ID]);
  });

  it('writes only the filters that are set', () => {
    expect(
      toProblemQuery({ search: '', typeIds: [], pointsMin: null, pointsMax: 3500, sort: null }),
    ).toEqual({
      search: undefined,
      type: undefined,
      min: undefined,
      max: 3500,
      sort: undefined,
    });
  });
});

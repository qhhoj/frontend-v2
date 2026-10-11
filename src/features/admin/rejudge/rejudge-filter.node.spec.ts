import { describe, expect, it } from 'vitest';
import {
  checkRejudgeFilter,
  emptyRejudgeFilter,
  filterFromQuery,
  toRejudgeBody,
} from './rejudge-filter';

const ID = '0198c3a1-0000-7000-8000-000000000001';

describe('rejudge filter', () => {
  it('accepts an empty filter (site-wide) and refuses ids that are not submission ids', () => {
    expect(checkRejudgeFilter(emptyRejudgeFilter())).toEqual({});
    expect(Object.keys(checkRejudgeFilter({ ...emptyRejudgeFilter(), idFrom: '128' }))).toEqual([
      'idFrom',
    ]);
  });

  it('refuses a date range that ends before it starts', () => {
    const filter = {
      ...emptyRejudgeFilter(),
      dateFrom: '2026-10-02T00:00',
      dateTo: '2026-10-01T00:00',
    };
    expect(Object.keys(checkRejudgeFilter(filter))).toEqual(['dateTo']);
  });

  it('sends only what was chosen, trimmed, with local dates as instants', () => {
    expect(toRejudgeBody({ ...emptyRejudgeFilter(), problem: ' hcmus41c ' })).toEqual({
      problem: 'hcmus41c',
    });
    const body = toRejudgeBody({
      ...emptyRejudgeFilter(),
      contest: 'voi26',
      idFrom: ID,
      dateFrom: '2026-10-01T08:00',
      languageIds: ['l1'],
      results: ['WA', 'TLE'],
      force: true,
    });
    expect(body).toEqual({
      contest: 'voi26',
      idFrom: ID,
      dateFrom: new Date('2026-10-01T08:00').toISOString(),
      languages: ['l1'],
      results: ['WA', 'TLE'],
      force: true,
    });
  });

  it('prefills only the linkable text fields from the URL', () => {
    const filter = filterFromQuery({ contest: 'voi26', problem: 'a', force: 'true', user: ['x'] });
    expect(filter).toMatchObject({ contest: 'voi26', problem: 'a', user: '', force: false });
  });
});

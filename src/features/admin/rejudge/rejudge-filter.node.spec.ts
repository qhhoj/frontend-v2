import { describe, expect, it } from 'vitest';
import {
  checkRejudgeFilter,
  emptyRejudgeFilter,
  filterFromQuery,
  toRejudgeBody,
} from './rejudge-filter';

describe('rejudge filter', () => {
  it('accepts an empty filter (site-wide)', () => {
    expect(checkRejudgeFilter(emptyRejudgeFilter())).toEqual({});
  });

  it('refuses a date range that ends before it starts', () => {
    const filter = {
      ...emptyRejudgeFilter(),
      dateFrom: '2026-10-02T00:00:00.000Z',
      dateTo: '2026-10-01T00:00:00.000Z',
    };
    expect(Object.keys(checkRejudgeFilter(filter))).toEqual(['dateTo']);
  });

  it('sends only what was chosen, trimmed, with the dates as instants', () => {
    expect(toRejudgeBody({ ...emptyRejudgeFilter(), problem: ' hcmus41c ' })).toEqual({
      problem: 'hcmus41c',
    });
    const body = toRejudgeBody({
      ...emptyRejudgeFilter(),
      contest: 'voi26',
      dateFrom: '2026-10-01T01:00:00.000Z',
      languageIds: ['l1'],
      results: ['WA', 'TLE'],
      force: true,
    });
    expect(body).toEqual({
      contest: 'voi26',
      dateFrom: '2026-10-01T01:00:00.000Z',
      languages: ['l1'],
      results: ['WA', 'TLE'],
      force: true,
    });
  });

  it('prefills only the linkable text fields from the URL', () => {
    const filter = filterFromQuery({
      contest: 'voi26',
      problem: 'a',
      force: 'true',
      user: ['x'],
      idFrom: 'old-link',
    });
    expect(filter).toMatchObject({ contest: 'voi26', problem: 'a', user: '', force: false });
    expect(filter).not.toHaveProperty('idFrom');
  });
});

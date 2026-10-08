import { describe, expect, it } from 'vitest';
import {
  groupQuery,
  parseContestListFilters,
  toContestListLocation,
} from './use-contest-list-filters';

describe('contest list filters', () => {
  it('reads search, rated, one phase and the page from the URL, dropping what the API would refuse', () => {
    expect(
      parseContestListFilters({ search: ' round ', rated: '1', phase: 'ended', page: '3' }),
    ).toEqual({
      search: ' round ',
      isRatedOnly: true,
      phase: 'ended',
      page: 3,
    });
    expect(
      parseContestListFilters({ search: 'x'.repeat(150), rated: 'yes', phase: 'past', page: '0' }),
    ).toEqual({
      search: 'x'.repeat(100),
      isRatedOnly: false,
      phase: null,
      page: 1,
    });
  });

  it('leaves defaults out of the URL', () => {
    expect(toContestListLocation({ search: '', isRatedOnly: false, phase: null, page: 1 })).toEqual(
      {
        search: undefined,
        rated: undefined,
        phase: undefined,
        page: undefined,
      },
    );
  });

  it('asks each overview group for its own page size and always its first page', () => {
    const filters = { search: 'qhh', isRatedOnly: true, phase: null, page: 4 };
    expect(groupQuery(filters, 'running')).toEqual({
      phase: 'running',
      search: 'qhh',
      rated: true,
      page: 1,
      pageSize: 100,
    });
    expect(groupQuery(filters, 'upcoming').pageSize).toBe(3);
    expect(groupQuery(filters, 'ended').pageSize).toBe(5);
  });

  it('pages through one group when the URL names it, and never sends rated=false', () => {
    expect(
      groupQuery({ search: '', isRatedOnly: false, phase: 'ended', page: 4 }, 'ended'),
    ).toEqual({
      phase: 'ended',
      search: undefined,
      rated: undefined,
      page: 4,
      pageSize: 20,
    });
  });
});

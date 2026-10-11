import { describe, expect, it } from 'vitest';
import { contestFilterQueryOf, contestListQueryOf, filtersFromQuery } from './contest-list-filters';

describe('staff contest list filters', () => {
  it('reads the address, dropping unknown values and malformed dates', () => {
    const filters = filtersFromQuery({
      phase: 'later',
      scope: 'hidden',
      sort: 'random',
      from: '2026-02-30x',
      before: '2026-03-01',
      page: '2',
    });
    expect(filters).toMatchObject({
      phase: 'all',
      scope: 'hidden',
      sort: '',
      from: '',
      before: '2026-03-01',
      page: 2,
    });
  });

  it('asks only for editable contests and maps the scope onto mine / visible', () => {
    expect(contestListQueryOf(filtersFromQuery({ scope: 'hidden' }))).toMatchObject({
      editable: true,
      visible: false,
      mine: undefined,
    });
    expect(contestListQueryOf(filtersFromQuery({ scope: 'mine', sort: 'users' }))).toMatchObject({
      mine: true,
      visible: undefined,
      sort: 'users',
    });
  });

  it('sends a date as the local midnight that starts it', () => {
    const query = contestListQueryOf(filtersFromQuery({ from: '2026-05-04' }));
    expect(new Date(query.startFrom!).getTime()).toBe(new Date(2026, 4, 4).getTime());
    expect(query.startBefore).toBeUndefined();
  });

  it('drops defaults from the address and restarts paging', () => {
    expect(
      contestFilterQueryOf({ page: '3', scope: 'mine' }, { scope: 'all', sort: 'name' }),
    ).toEqual({ page: undefined, scope: undefined, sort: 'name' });
  });
});

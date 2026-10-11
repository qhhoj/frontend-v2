import { describe, expect, it } from 'vitest';
import { filterQueryOf, filtersFromQuery, listQueryOf } from './problem-list-filters';

describe('staff problem list filters', () => {
  it('reads the address, falling back on unknown status and sort', () => {
    const filters = filtersFromQuery({ status: 'bogus', sort: 'acRate!', group: 'g1', page: '3' });
    expect(filters).toMatchObject({ status: 'all', sort: '-date', groupId: 'g1', page: 3 });
  });

  it('turns the suggested tab into the review-queue query, across every visibility', () => {
    const query = listQueryOf(filtersFromQuery({ status: 'suggested', type: 't1' }), 'u1');
    expect(query).toMatchObject({
      visibility: 'all',
      suggested: true,
      typeIds: ['t1'],
      authorId: 'u1',
    });
  });

  it('drops defaults and empty values from the address and restarts paging', () => {
    expect(
      filterQueryOf({ page: '4', q: 'dp', status: 'private' }, { status: 'all', q: '' }),
    ).toEqual({ page: undefined, q: undefined, status: undefined });
    expect(filterQueryOf({}, { sort: 'points', author: 'alice' })).toMatchObject({
      sort: 'points',
      author: 'alice',
    });
  });
});

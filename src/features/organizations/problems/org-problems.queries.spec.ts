import { describe, expect, it } from 'vitest';
import { ORG_PROBLEM_PAGE_SIZE } from '@/api/organization-problems.api';
import { queryOfFilters } from './org-problems.queries';

describe('queryOfFilters', () => {
  it('leaves an empty tag and an empty search out of the request', () => {
    expect(queryOfFilters({ tag: null, archived: 'false', q: '', page: 1 })).toEqual({
      archived: 'false',
      page: 1,
      pageSize: ORG_PROBLEM_PAGE_SIZE,
    });
  });

  it('sends the tag slug, the archive filter, the search and the page', () => {
    expect(queryOfFilters({ tag: 'dt', archived: 'all', q: 'cây', page: 3 })).toEqual({
      tag: 'dt',
      archived: 'all',
      q: 'cây',
      page: 3,
      pageSize: ORG_PROBLEM_PAGE_SIZE,
    });
  });
});

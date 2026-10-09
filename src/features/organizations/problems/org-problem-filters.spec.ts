import { describe, expect, it } from 'vitest';
import { filtersFromQuery, listStateOf, routeQueryOf, withFilter } from './org-problem-filters';

const DEFAULTS = { tag: null, archived: 'false', q: '', page: 1 } as const;

describe('org problem filters', () => {
  it('reads defaults from an empty query and ignores malformed values', () => {
    expect(filtersFromQuery({})).toEqual(DEFAULTS);
    expect(filtersFromQuery({ tag: 'Bad Tag', archived: 'maybe', page: '-3' })).toEqual(DEFAULTS);
  });

  it('reads a tag slug, an archive filter, a trimmed search capped at 50 and a page', () => {
    expect(
      filtersFromQuery({ tag: 'dt', archived: 'all', q: `  ${'x'.repeat(60)} `, page: '3' }),
    ).toEqual({ tag: 'dt', archived: 'all', q: 'x'.repeat(50), page: 3 });
  });

  it('writes only what differs from the defaults back to the URL', () => {
    expect(routeQueryOf({ ...DEFAULTS })).toEqual({});
    expect(routeQueryOf({ tag: 'dt', archived: 'true', q: 'cây', page: 2 })).toEqual({
      tag: 'dt',
      archived: 'true',
      q: 'cây',
      page: '2',
    });
  });

  it('starts again from page 1 when a filter changes', () => {
    expect(withFilter({ ...DEFAULTS, page: 4 }, { tag: 'dt' })).toEqual({
      ...DEFAULTS,
      tag: 'dt',
      page: 1,
    });
  });

  it('tells an organization without problems from a filter that hides them', () => {
    expect(listStateOf(undefined, { ...DEFAULTS })).toBeNull();
    expect(listStateOf(4, { ...DEFAULTS })).toBe('rows');
    expect(listStateOf(0, { ...DEFAULTS })).toBe('empty');
    expect(listStateOf(0, { ...DEFAULTS, archived: 'all' })).toBe('empty');
    expect(listStateOf(0, { ...DEFAULTS, tag: 'dt' })).toBe('filteredEmpty');
    expect(listStateOf(0, { ...DEFAULTS, q: 'cây' })).toBe('filteredEmpty');
  });
});

import { describe, expect, it } from 'vitest';
import { parseSubmissionFilters, toSubmissionQuery, withPatch } from './use-submission-filters';

const UUID_OK = '0192a000-0000-7000-8000-0000000000c1';

describe('submission filters in the URL', () => {
  it('round-trips filters through the URL query and leaves defaults out', () => {
    const query = {
      problem: 'duongdi',
      user: 'user_01',
      result: ['AC', 'WA'],
      language: [UUID_OK],
      page: '3',
      live: '0',
    };
    const filters = parseSubmissionFilters(query);
    expect(filters).toEqual({
      problem: 'duongdi',
      user: 'user_01',
      results: ['AC', 'WA'],
      languageIds: [UUID_OK],
      page: 3,
      live: false,
    });
    expect(toSubmissionQuery(filters)).toEqual(query);
    expect(toSubmissionQuery(parseSubmissionFilters({}))).toEqual({});
  });

  it('drops what the API would answer with a 400', () => {
    const filters = parseSubmissionFilters({
      result: ['AC', 'XX'],
      language: ['not-a-uuid', UUID_OK],
      page: 'abc',
      problem: 'x'.repeat(40),
      user: 'y'.repeat(40),
    });
    expect(filters.results).toEqual(['AC']);
    expect(filters.languageIds).toEqual([UUID_OK]);
    expect(filters.page).toBe(1);
    expect(filters.problem).toHaveLength(32);
    expect(filters.user).toHaveLength(30);
    expect(parseSubmissionFilters({ page: '10001' }).page).toBe(1);
    expect(parseSubmissionFilters({ page: '0' }).page).toBe(1);
  });

  it('accepts every result the backend accepts, not only the six checkboxes (nothing is staff-gated)', () => {
    expect(parseSubmissionFilters({ result: 'IE' }).results).toEqual(['IE']);
  });

  it('reads live=0 as off and anything else as on', () => {
    expect(parseSubmissionFilters({ live: '0' }).live).toBe(false);
    expect(parseSubmissionFilters({ live: '1' }).live).toBe(true);
    expect(parseSubmissionFilters({}).live).toBe(true);
  });

  it('goes back to page 1 when a filter changes but not when the page does', () => {
    const current = parseSubmissionFilters({ page: '4' });
    expect(withPatch(current, { results: ['AC'] }).page).toBe(1);
    expect(withPatch(current, { page: 5 }).page).toBe(5);
    expect(withPatch(current, { live: false }).page).toBe(4);
  });
});

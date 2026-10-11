import { describe, expect, it } from 'vitest';
import { parseSubmissionFilters } from '../use-submission-filters';
import { keepsPreviousRows, scopeApiQuery, scopeQueryKey } from './submission-scope';
import type { SubmissionScope } from './submission-scope';

const filters = parseSubmissionFilters({ user: 'other', result: ['WA'], page: '2' });
const contest = (fixedUser: string | null): SubmissionScope => ({
  kind: 'contest',
  key: 'r42',
  fixedUser,
});

describe('scope → API query', () => {
  it('passes the URL filters through for the site and an organization', () => {
    for (const scope of [{ kind: 'global' }, { kind: 'organization', slug: 'qh' }] as const)
      expect(scopeApiQuery(scope, filters)).toMatchObject({
        user: 'other',
        result: ['WA'],
        page: 2,
      });
  });

  it("lets a contest's pinned user win over the URL's", () => {
    expect(scopeApiQuery(contest('me'), filters).user).toBe('me');
    expect(scopeApiQuery(contest(null), filters).user).toBe('other');
  });
});

describe('scope → cache key', () => {
  const query = scopeApiQuery({ kind: 'global' }, filters);
  it("keeps each list's key, so other caches (Home's recent rows) still share the prefix", () => {
    expect(scopeQueryKey({ kind: 'global' }, 'v', query).slice(0, 3)).toEqual([
      'submissions',
      'list',
      'v',
    ]);
    expect(scopeQueryKey({ kind: 'organization', slug: 'qh' }, 'v', query).slice(0, 4)).toEqual([
      'submissions',
      'organization',
      'v',
      'qh',
    ]);
    expect(scopeQueryKey(contest(null), 'v', query).slice(0, 4)).toEqual([
      'submissions',
      'contest',
      'v',
      'r42',
    ]);
  });
});

describe('keeping the previous rows while the next list loads', () => {
  const keyOf = (scope: SubmissionScope, viewer = 'v', source = filters) =>
    scopeQueryKey(scope, viewer, scopeApiQuery(scope, source));
  const otherUser = parseSubmissionFilters({ user: 'someone' });

  it('keeps them for another page or filter of the same list', () => {
    expect(
      keepsPreviousRows(keyOf({ kind: 'global' }), keyOf({ kind: 'global' }, 'v', otherUser)),
    ).toBe(true);
  });

  it('drops them for another scope or viewer', () => {
    expect(
      keepsPreviousRows(
        keyOf({ kind: 'organization', slug: 'a' }),
        keyOf({ kind: 'organization', slug: 'b' }),
      ),
    ).toBe(false);
    expect(keepsPreviousRows(keyOf({ kind: 'global' }, 'v'), keyOf({ kind: 'global' }, 'w'))).toBe(
      false,
    );
    expect(keepsPreviousRows(undefined, keyOf({ kind: 'global' }))).toBe(false);
  });

  it("drops a contest's all-users rows when the list narrows to the viewer's own", () => {
    expect(keepsPreviousRows(keyOf(contest(null)), keyOf(contest('me')))).toBe(false);
    expect(keepsPreviousRows(keyOf(contest('me')), keyOf(contest('me'), 'v', otherUser))).toBe(
      true,
    );
  });
});

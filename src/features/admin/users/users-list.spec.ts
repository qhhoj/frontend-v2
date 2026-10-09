import { describe, expect, it } from 'vitest';
import { userPage } from '@/test/fixtures';
import { staffUser } from '@/test/admin-fixtures/users';
import {
  canImpersonate,
  lastStaffPage,
  staffUsersQueryOf,
  STAFF_USERS_MAX_PAGE,
  USER_SEARCH_MAX_LENGTH,
  userStatusOf,
  usersViewFromQuery,
  usersViewToQuery,
} from './users-list';

describe('users list', () => {
  it('never offers a page past the backend cap, and always offers page 1', () => {
    expect(lastStaffPage(0, 50)).toBe(1);
    expect(lastStaffPage(120, 50)).toBe(3);
    expect(lastStaffPage(50 * 900, 50)).toBe(STAFF_USERS_MAX_PAGE);
  });

  it('lets only a superuser impersonate, and neither another superuser nor a banned account', () => {
    const plain = userPage({ staff: { isSuperuser: false, banReason: null } });
    expect(canImpersonate(true, plain)).toBe(true);
    expect(canImpersonate(false, plain)).toBe(false);
    expect(canImpersonate(true, userPage({ staff: { isSuperuser: true, banReason: null } }))).toBe(
      false,
    );
    expect(
      canImpersonate(
        true,
        userPage({ displayRank: 'banned', staff: { isSuperuser: false, banReason: 'Spam' } }),
      ),
    ).toBe(false);
  });

  it('refuses when the target staff facts are unknown, so a superuser is never guessed', () => {
    expect(canImpersonate(true, userPage({ staff: null }))).toBe(false);
  });
});

describe('users list view', () => {
  it('reads the tab, the trimmed and capped search and a valid page from the URL, falling back to the defaults', () => {
    expect(usersViewFromQuery({})).toEqual({ tab: 'all', search: '', page: 1 });
    expect(usersViewFromQuery({ tab: 'banned', q: '  tuan ', page: '3' })).toEqual({
      tab: 'banned',
      search: 'tuan',
      page: 3,
    });
    expect(usersViewFromQuery({ tab: 'nonsense', page: '0' })).toEqual({
      tab: 'all',
      search: '',
      page: 1,
    });
    expect(usersViewFromQuery({ q: 'x'.repeat(100) }).search).toHaveLength(USER_SEARCH_MAX_LENGTH);
    expect(usersViewFromQuery({ page: '900' }).page).toBe(STAFF_USERS_MAX_PAGE);
  });

  it.each([
    ['all', undefined],
    ['active', false],
    ['banned', true],
  ] as const)('maps the %s tab to banned=%s and never sends a blank search', (tab, banned) => {
    const query = staffUsersQueryOf({ tab, search: '   ', page: 2 });
    expect(query).toEqual(banned === undefined ? { page: 2 } : { page: 2, banned });
    expect(staffUsersQueryOf({ tab, search: 'tuan', page: 1 }).search).toBe('tuan');
  });

  it('writes only what differs from the defaults, keeps the opened user, and starts a new filter on page 1', () => {
    expect(usersViewToQuery({ tab: 'all', search: '', page: 1 }, {})).toEqual({});
    expect(
      usersViewToQuery({ tab: 'banned', search: 'sp', page: 2 }, { user: 'tuan_k', tab: 'all' }),
    ).toEqual({
      user: 'tuan_k',
      tab: 'banned',
      q: 'sp',
      page: '2',
    });
  });

  it.each([
    [{ banReason: 'Spam', isActive: false }, 'banned'],
    [{ banReason: 'Spam', isActive: true }, 'banned'],
    [{ banReason: null, isActive: false }, 'inactive'],
    [{ banReason: null, isActive: true }, 'active'],
  ] as const)('reads the status of %j as %s', (user, status) => {
    expect(userStatusOf({ ...staffUser(), ...user })).toBe(status);
  });
});

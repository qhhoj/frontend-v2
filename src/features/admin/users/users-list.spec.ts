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
    const plain = userPage({ staff: { isSuperuser: false, isActive: true, banReason: null } });
    expect(canImpersonate(true, plain)).toBe(true);
    expect(canImpersonate(false, plain)).toBe(false);
    expect(
      canImpersonate(
        true,
        userPage({ staff: { isSuperuser: true, isActive: true, banReason: null } }),
      ),
    ).toBe(false);
    expect(
      canImpersonate(
        true,
        userPage({
          displayRank: 'banned',
          staff: { isSuperuser: false, isActive: true, banReason: 'Spam' },
        }),
      ),
    ).toBe(false);
    const inactive = userPage({ staff: { isSuperuser: false, isActive: false, banReason: null } });
    expect(canImpersonate(true, inactive)).toBe(false);
    expect(canImpersonate(true, userPage({ staff: null }))).toBe(false);
  });
});

describe('users list view', () => {
  it('reads the tab, the trimmed and capped search and a valid page from the URL, falling back to the defaults', () => {
    expect(usersViewFromQuery({})).toEqual({ tab: 'all', sort: 'default', search: '', page: 1 });
    expect(usersViewFromQuery({ tab: 'banned', q: '  tuan ', page: '3' })).toEqual({
      tab: 'banned',
      sort: 'default',
      search: 'tuan',
      page: 3,
    });
    expect(usersViewFromQuery({ tab: 'nonsense', page: '0' })).toEqual({
      tab: 'all',
      sort: 'default',
      search: '',
      page: 1,
    });
    expect(usersViewFromQuery({ q: 'x'.repeat(100) }).search).toHaveLength(USER_SEARCH_MAX_LENGTH);
    expect(usersViewFromQuery({ page: '900' }).page).toBe(STAFF_USERS_MAX_PAGE);
  });

  it('maps the tab to banned, the sort to the server value, and never sends a blank search', () => {
    const view = { tab: 'all', sort: 'default', search: '   ', page: 2 } as const;
    expect(staffUsersQueryOf(view)).toEqual({ page: 2 });
    expect(staffUsersQueryOf({ ...view, tab: 'active' })).toEqual({ page: 2, banned: false });
    expect(
      staffUsersQueryOf({ ...view, tab: 'banned', search: 'tuan', sort: 'lastAccess' }),
    ).toEqual({
      page: 2,
      banned: true,
      search: 'tuan',
      sort: 'lastAccess',
    });
    expect(usersViewFromQuery({ sort: '-lastAccess' }).sort).toBe('-lastAccess');
    expect(usersViewFromQuery({ sort: 'username' }).sort).toBe('default');
  });

  it('writes only what differs from the defaults, keeps the opened user, and starts a new filter on page 1', () => {
    expect(usersViewToQuery({ tab: 'all', sort: 'default', search: '', page: 1 }, {})).toEqual({});
    expect(
      usersViewToQuery(
        { tab: 'banned', sort: 'default', search: 'sp', page: 2 },
        { user: 'tuan_k', tab: 'all' },
      ),
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

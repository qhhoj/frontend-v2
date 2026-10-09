import { describe, expect, it } from 'vitest';
import { mockApi, page } from '@/test/mock-api';
import { STAFF_USERS_PAGE_SIZE, fetchStaffUsers, unbanUser } from './users-admin.api';

describe('users admin calls', () => {
  it('lists staff users with search, ban filter, sort, page and the fixed page size', async () => {
    const calls = mockApi({ 'GET /admin/users': page([]) });
    await fetchStaffUsers({ search: 'an', banned: true, sort: '-lastAccess', page: 2 });
    expect(Object.fromEntries(calls[0]!.query)).toEqual({
      search: 'an',
      banned: 'true',
      sort: '-lastAccess',
      page: '2',
      pageSize: String(STAFF_USERS_PAGE_SIZE),
    });
  });

  it('unbans a user by encoded username', async () => {
    const calls = mockApi({ 'POST /users/a%2Fb/unban': { status: 204 } });
    await unbanUser('a/b');
    expect(calls[0]!.method).toBe('POST');
  });
});

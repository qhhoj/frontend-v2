import { describe, expect, it } from 'vitest';
import { userPage } from '@/test/fixtures';
import { canImpersonate, lastStaffPage, STAFF_USERS_MAX_PAGE } from './users-list';

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

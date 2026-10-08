import { describe, expect, it } from 'vitest';
import { sessionUser } from '@/test/fixtures';
import { hasPermission } from './permissions';

describe('hasPermission', () => {
  it('grants every permission to a superuser, held or not', () => {
    expect(hasPermission(sessionUser({ isSuperuser: true }), 'judge.ban_user')).toBe(true);
  });
  it('grants a permission the user holds', () => {
    expect(hasPermission(sessionUser({ permissions: ['judge.ban_user'] }), 'judge.ban_user')).toBe(
      true,
    );
  });
  it('refuses an anonymous viewer and a user without the permission', () => {
    expect(hasPermission(null, 'judge.ban_user')).toBe(false);
    expect(
      hasPermission(
        sessionUser({ permissions: ['judge.view_all_user_comment'] }),
        'judge.ban_user',
      ),
    ).toBe(false);
  });
});

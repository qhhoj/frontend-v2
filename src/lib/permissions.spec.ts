import { describe, expect, it } from 'vitest';
import { sessionUser } from '@/test/fixtures';
import { allowsAny, hasPermission } from './permissions';

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

const staff = (permissions: string[], isSuperuser = false) => ({ isSuperuser, permissions });

describe('allowsAny', () => {
  it('reads a list as any-of', () => {
    const rule = ['judge.edit_own_problem', 'judge.edit_all_problem'];
    expect(allowsAny(staff(['judge.edit_all_problem']), rule)).toBe(true);
    expect(allowsAny(staff(['judge.add_contest']), rule)).toBe(false);
  });

  it('accepts a single permission string and a real session user', () => {
    expect(allowsAny(staff(['judge.moss_contest']), 'judge.moss_contest')).toBe(true);
    expect(
      allowsAny(sessionUser({ permissions: ['judge.moss_contest'] }), 'judge.moss_contest'),
    ).toBe(true);
  });

  it('lets a superuser through a non-empty rule', () => {
    expect(allowsAny(staff([], true), ['judge.change_settings', 'judge.add_contest'])).toBe(true);
  });

  it('treats a null rule as "any signed-in user" and an empty list as nobody', () => {
    expect(allowsAny(staff([]), null)).toBe(true);
    expect(allowsAny(null, null)).toBe(false);
    expect(allowsAny(staff([], true), [])).toBe(false);
  });
});

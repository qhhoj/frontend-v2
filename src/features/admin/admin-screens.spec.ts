import { describe, expect, it } from 'vitest';
import { allowsAny } from '@/lib/permissions';
import { ADMIN_SCREENS } from './admin-screens';

const staff = (permissions: string[]) => ({ isSuperuser: false, permissions });

describe('problem editor screens', () => {
  it('refuse a holder of edit_all_problem alone, because the backend needs edit_own_problem for every edit', () => {
    const holder = staff(['judge.edit_all_problem']);
    expect(allowsAny(holder, ADMIN_SCREENS.problemGeneral.permission)).toBe(false);
    expect(allowsAny(holder, ADMIN_SCREENS.problems.permission)).toBe(false);
  });

  it('open for a holder of edit_own_problem, the base permission of every edit', () => {
    const holder = staff(['judge.edit_own_problem']);
    expect(allowsAny(holder, ADMIN_SCREENS.problemGeneral.permission)).toBe(true);
    expect(allowsAny(holder, ADMIN_SCREENS.problemData.permission)).toBe(true);
  });
});

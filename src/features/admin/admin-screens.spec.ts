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
});

describe('language form screens', () => {
  it('open "new" for add_language only and "edit" for change_language only', () => {
    const adder = staff(['judge.add_language']);
    const changer = staff(['judge.change_language']);
    expect(allowsAny(adder, ADMIN_SCREENS.languageNew.permission)).toBe(true);
    expect(allowsAny(changer, ADMIN_SCREENS.languageNew.permission)).toBe(false);
    expect(allowsAny(changer, ADMIN_SCREENS.languageEdit.permission)).toBe(true);
    expect(allowsAny(adder, ADMIN_SCREENS.languageEdit.permission)).toBe(false);
  });
});

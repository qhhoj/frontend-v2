import { describe, expect, it } from 'vitest';
import { allowsAny } from '@/lib/permissions';
import { routes } from '@/router/routes';
import { ADMIN_NAV, heldPermission, isCurrentNav, visibleDashboard, visibleNav } from './admin-nav';

const staff = (permissions: string[], isSuperuser = false) => ({ isSuperuser, permissions });
const idsOf = (groups: ReturnType<typeof visibleNav>) =>
  groups.flatMap((group) => group.items.map((item) => item.id));
const allItems = ADMIN_NAV.flatMap((group) => group.items);
const everyPermission = [
  ...new Set(
    allItems.flatMap((item) => (item.permission === null ? [] : [item.permission].flat())),
  ),
];

describe('admin nav', () => {
  it('shows an item exactly when the account may open its screen, for every single permission, none and a superuser', () => {
    const holders = [
      staff([]),
      staff([], true),
      ...everyPermission.map((permission) => staff([permission])),
    ];
    for (const holder of holders) {
      const shown = idsOf(visibleNav(ADMIN_NAV, holder));
      for (const item of allItems) {
        expect(shown.includes(item.id), `${item.id} for ${holder.permissions.join()}`).toBe(
          allowsAny(holder, item.permission),
        );
      }
    }
  });
});

describe('admin nav per permission', () => {
  it('shows every item to a superuser, none twice, each linking to a route that exists', () => {
    const shown = visibleNav(ADMIN_NAV, staff([], true)).flatMap((group) => group.items);
    expect(new Set(shown.map((item) => item.id)).size).toBe(shown.length);
    expect(shown).toHaveLength(allItems.length);
    for (const item of shown) {
      expect(
        routes.some((route) => route.name === item.routeName),
        item.id,
      ).toBe(true);
    }
  });
});

describe('admin nav current section and dashboard', () => {
  it('marks a section current on its own sub-pages but not on a sibling that shares a prefix', () => {
    expect(isCurrentNav('/admin/problems', '/admin/problems/aplusb/data')).toBe(true);
    expect(isCurrentNav('/admin/problems', '/admin/problems')).toBe(true);
    expect(isCurrentNav('/admin/problems/import', '/admin/problems/import')).toBe(true);
    expect(isCurrentNav('/admin/problems', '/admin/problems/import')).toBe(false);
    expect(isCurrentNav('/admin/pages', '/admin/pages-old')).toBe(false);
  });

  it('marks only the most specific item on a nested route, whichever items nest', () => {
    expect(isCurrentNav('/admin/organizations', '/admin/organizations/quotas')).toBe(false);
    expect(isCurrentNav('/admin/organizations/quotas', '/admin/organizations/quotas')).toBe(true);
    expect(isCurrentNav('/admin/organizations', '/admin/organizations/lhp')).toBe(true);
    const nested = ['/admin/a', '/admin/a/b', '/admin/a/b/c'];
    const current = nested.filter((path) => isCurrentNav(path, '/admin/a/b/c/d', nested));
    expect(current).toEqual(['/admin/a/b/c']);
    const highlighted = ADMIN_NAV.flatMap((navGroup) => navGroup.items).filter((item) =>
      isCurrentNav(item.path, '/admin/organizations/quotas'),
    );
    expect(highlighted.map((item) => item.id)).toEqual(['organizationQuotas']);
  });

  it('builds the dashboard from the same rules and names only a permission the viewer holds', () => {
    const sections = visibleDashboard(staff(['judge.add_contest', 'judge.change_judge']));
    expect(sections.map((section) => section.items.map((item) => item.id))).toEqual([
      ['contests', 'judges'],
    ]);
    expect(
      heldPermission(
        ['judge.add_contest', 'judge.edit_own_contest'],
        staff(['judge.edit_own_contest']),
      ),
    ).toBe('judge.edit_own_contest');
    expect(heldPermission(['judge.add_contest', 'judge.edit_own_contest'], staff([]))).toBeNull();
    expect(heldPermission(null, staff([], true))).toBeNull();
  });
});

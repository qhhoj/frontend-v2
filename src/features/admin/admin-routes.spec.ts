import { describe, expect, it } from 'vitest';
import { routes } from '@/router/routes';
import { ADMIN_SCREENS } from './admin-screens';
import { adminRoutes } from './admin-routes';

describe('admin routes', () => {
  it('has one staff-only admin-layout route per screen, carrying the screen permission', () => {
    for (const [id, screen] of Object.entries(ADMIN_SCREENS)) {
      const record = adminRoutes.find((route) => route.name === `admin-${id}`);
      expect(record?.path, id).toBe(screen.path);
      expect(record?.meta).toMatchObject({
        requiresAuth: true,
        staffOnly: true,
        layout: 'admin',
        titleKey: `admin.shell.screens.${id}`,
      });
      expect(record?.meta?.permission ?? null).toEqual(screen.permission);
    }
  });

  it('guards representative screens with the permission the backend checks, written out literally', () => {
    const permissionOf = (name: string) =>
      adminRoutes.find((route) => route.name === name)?.meta?.permission ?? null;
    expect(permissionOf('admin-dashboard')).toBeNull();
    expect(permissionOf('admin-users')).toBe('judge.ban_user');
    expect(permissionOf('admin-problemData')).toBe('judge.edit_own_problem');
    expect(permissionOf('admin-contestGeneral')).toEqual([
      'judge.edit_own_contest',
      'judge.edit_all_contest',
    ]);
    expect(permissionOf('admin-languages')).toEqual([
      'judge.change_language',
      'judge.add_language',
    ]);
    expect(permissionOf('admin-pages')).toBe('flatpages.change_flatpage');
  });

  it('names only backend permission namespaces in every screen rule', () => {
    const names = Object.values(ADMIN_SCREENS)
      .flatMap((screen) => [screen.permission ?? []].flat())
      .map(String);
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((name) => /^(judge|flatpages)\.[a-z_]+$/.test(name))).toBe(true);
  });

  it('keeps every screen path under /admin and unique', () => {
    const paths = Object.values(ADMIN_SCREENS).map((screen) => screen.path);
    expect(paths.every((path) => path === '/admin' || path.startsWith('/admin/'))).toBe(true);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('sends unknown admin paths to a staff-only not-found inside the admin layout', () => {
    const unknown = adminRoutes.find((route) => route.name === 'admin-unknown');
    expect(unknown?.path).toBe('/admin/:pathMatch(.*)*');
    expect(unknown?.meta).toMatchObject({ staffOnly: true, layout: 'admin' });
  });

  it('is mounted in the app routes before the site catch-all', () => {
    const names = routes.map((route) => route.name);
    expect(names.indexOf('admin-dashboard')).toBeGreaterThan(-1);
    expect(names.indexOf('admin-unknown')).toBeLessThan(names.indexOf('not-found'));
    expect(names).not.toContain('admin');
  });

  it('redirects a bare editor path to its first tab', () => {
    expect(adminRoutes.find((route) => route.path === '/admin/problems/:code')?.redirect).toEqual({
      name: 'admin-problemGeneral',
    });
    expect(adminRoutes.find((route) => route.path === '/admin/contests/:key')?.redirect).toEqual({
      name: 'admin-contestGeneral',
    });
  });
});

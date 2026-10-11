import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory } from 'vue-router';
import { onCsrfFailed, onUnauthorized } from '@/api/client';
import { sessionUser, signedIn, signedOut } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { createAppRouter } from './index';

async function navigate(path: string, me: MockHandler) {
  const calls = mockApi({ 'GET /auth/me': me });
  const router = createAppRouter(createMemoryHistory());
  await router.push(path);
  return { route: router.currentRoute.value, router, calls };
}

describe('navigation guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    onCsrfFailed(null);
    onUnauthorized(null);
  });

  it('redirects a signed-out viewer to login with the path', async () => {
    const { route } = await navigate('/settings?tab=theme', signedOut);
    expect(route.name).toBe('login');
    expect(route.query.redirect).toBe('/settings?tab=theme');
  });

  it('sends a signed-in viewer away from guest-only pages', async () => {
    const { route } = await navigate('/login', signedIn());
    expect(route.name).toBe('home');
  });

  it('holds a viewer with a pending second factor on the 2FA page', async () => {
    const { route } = await navigate(
      '/problems',
      signedIn({ user: null, twoFactorRequired: true }),
    );
    expect(route.name).toBe('login-2fa');
    expect(route.query.redirect).toBe('/problems');
  });

  it.each([
    ['/activate/k123', 'k123'],
    ['/Activate/KEY', 'KEY'],
    ['/reset-password/TOKEN/', 'TOKEN'],
    ['/Reset-Password/tok9', 'tok9'],
    ['/register/social?token=pending-1', 'pending-1'],
    ['/register/social/?token=x', 'token=x'],
    ['/REGISTER/SOCIAL?token=x', 'token=x'],
  ])('keeps the credential of %s out of the query under a gate', async (path, secret) => {
    // The reset page is open to a pending second factor (`allowPartial`): it stays, so only the forced change moves it.
    const stays = path.toLowerCase().startsWith('/reset-password');
    const gates = [
      [signedIn({ user: null, twoFactorRequired: true }), stays ? 'reset-password' : 'login-2fa'],
      [signedIn({ passwordChangeRequired: true }), 'account-password'],
    ] as const;
    for (const [session, gate] of gates) {
      setActivePinia(createPinia());
      const { route } = await navigate(path, () => session);
      expect(route.name).toBe(gate);
      expect(route.query.redirect).toBeUndefined();
      if (route.name !== 'reset-password') expect(route.fullPath).not.toContain(secret);
    }
  });

  it('keeps the 2FA step for a pending second factor', async () => {
    const { route } = await navigate(
      '/login/2fa?redirect=/settings',
      signedIn({ user: null, twoFactorRequired: true }),
    );
    expect(route.name).toBe('login-2fa');
  });

  it.each([
    ['/login/2fa?redirect=/settings', '/settings'],
    ['/login/2fa?redirect=//evil.example', '/'],
    ['/login/2fa', '/'],
  ])('sends a fully signed-in viewer away from %s', async (path, destination) => {
    const { route } = await navigate(path, signedIn());
    expect(route.fullPath).toBe(destination);
  });

  it('sends a signed-out viewer from 2FA to login, keeping the redirect', async () => {
    const { route } = await navigate('/login/2fa?redirect=/settings', signedOut);
    expect(route.name).toBe('login');
    expect(route.query.redirect).toBe('/settings');
  });

  it('forces a password change when the password is pwned', async () => {
    const { route } = await navigate('/problems', signedIn({ passwordChangeRequired: true }));
    expect(route.name).toBe('account-password');
    expect(route.query.redirect).toBe('/problems');
  });

  it('shows not-found on admin routes to a viewer who may use no admin screen, and keeps the URL', async () => {
    const { route } = await navigate('/admin/judges', signedIn());
    expect(route.name).toBe('not-found');
    expect(route.path).toBe('/admin/judges');
  });

  it('opens the admin area to authors and organization admins who are not staff', async () => {
    const author = signedIn({ user: sessionUser({ permissions: ['judge.edit_own_problem'] }) });
    expect((await navigate('/admin/problems', author)).route.name).toBe('admin-problems');
    const organizationAdmin = signedIn({
      user: sessionUser({ adminCapabilities: { organizations: true } }),
    });
    expect((await navigate('/admin/organizations', organizationAdmin)).route.name).toBe(
      'admin-organizations',
    );
  });

  it('keeps encoded characters of a hidden admin URL as they were', async () => {
    const { route } = await navigate('/admin/a%2Fb/c%20d', signedIn());
    expect(route.name).toBe('not-found');
    expect(route.path).toBe('/admin/a%2Fb/c%20d');
  });

  it('loads the session once across navigations', async () => {
    const { router, calls } = await navigate('/problems', signedOut);
    await router.push('/contests');
    expect(calls).toHaveLength(1);
  });

  it('opens public pages while the backend is unreachable and retries the session later', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('offline')));
    const router = createAppRouter(createMemoryHistory());
    await router.push('/problems');
    expect(router.currentRoute.value.name).toBe('problems');
    await router.push('/settings');
    expect(router.currentRoute.value.name).toBe('login');
    const calls = mockApi({ 'GET /auth/me': signedOut });
    await router.push('/contests');
    expect(calls).toHaveLength(1);
  });

  it('sends admin pages to login when the session cannot be loaded', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('offline')));
    const router = createAppRouter(createMemoryHistory());
    await router.push('/admin/judges');
    expect(router.currentRoute.value.name).toBe('login');
  });
});

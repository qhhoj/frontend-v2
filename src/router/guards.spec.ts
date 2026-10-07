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

  it('lets anyone open a public page', async () => {
    const { route } = await navigate('/problems', signedOut);
    expect(route.name).toBe('problems');
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

  it('does not carry a redirect to the home page into login', async () => {
    const { route } = await navigate('/login/2fa', signedOut);
    expect(route.fullPath).toBe('/login');
  });

  it('sends a signed-out viewer from 2FA to login, keeping the redirect', async () => {
    const { route } = await navigate('/login/2fa?redirect=/settings', signedOut);
    expect(route.name).toBe('login');
    expect(route.query.redirect).toBe('/settings');
  });

  it('forces a password change when the password is pwned', async () => {
    const { route } = await navigate('/problems', signedIn({ passwordChangeRequired: true }));
    expect(route.name).toBe('account-password');
  });

  it('shows not-found to non-staff on admin routes and keeps the URL', async () => {
    const { route } = await navigate('/admin/judges', signedIn());
    expect(route.name).toBe('not-found');
    expect(route.path).toBe('/admin/judges');
  });

  it('keeps encoded characters of a hidden admin URL as they were', async () => {
    const { route } = await navigate('/admin/a%2Fb/c%20d', signedIn());
    expect(route.name).toBe('not-found');
    expect(route.path).toBe('/admin/a%2Fb/c%20d');
  });

  it('opens admin routes for staff', async () => {
    const { route } = await navigate(
      '/admin/judges',
      signedIn({ user: sessionUser({ isStaff: true }) }),
    );
    expect(route.name).toBe('admin');
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

  it('titles the document from the route', async () => {
    await navigate('/problems', signedOut);
    expect(document.title).toBe('Bài tập · QHHOJ');
  });
});

import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { apiRequest } from '@/api/client';
import { profile, problemMeta, sessionResponse, signedIn, signedOut } from '@/test/fixtures';
import { loginRoutes } from '@/test/auth-routes';
import { homeRoutes } from '@/test/home-routes';
import { fail, mockApi, ok } from '@/test/mock-api';
import { blogListRoutes } from '@/test/community-routes';
import { mountApp } from '@/test/mount';
import { useThemeStore } from '@/theme/theme.store';

// The first mount in a file loads route chunks cold.
vi.setConfig({ testTimeout: 30_000 });

describe('auth screens', () => {
  it('returns to a safe redirect after login', async () => {
    const calls = mockApi({
      ...blogListRoutes,
      ...loginRoutes,
      'GET /auth/me': signedOut,
      'POST /auth/login': ok(sessionResponse()),
      'GET /profile': ok(profile()),
      'GET /problems/meta': ok(problemMeta()),
      ...homeRoutes,
    });
    const { wrapper, router } = await mountApp('/login?redirect=/settings');
    await wrapper.get('input[name="username"]').setValue('user_01');
    await wrapper.get('input[name="password"]').setValue('correct horse');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(calls.find((call) => call.path === '/auth/login')?.body).toEqual({
      username: 'user_01',
      password: 'correct horse',
    });
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/settings'), {
      timeout: 5000,
    });
  });

  it.each(['//evil.example/x', '/\\evil.example', 'https://evil.example', 'javascript:alert(1)'])(
    'does not follow the hostile redirect %s after login',
    async (hostile) => {
      mockApi({
        ...blogListRoutes,
        ...loginRoutes,
        'GET /auth/me': signedOut,
        'POST /auth/login': ok(sessionResponse()),
        'GET /profile': ok(profile()),
        ...homeRoutes,
      });
      const { wrapper, router } = await mountApp(`/login?redirect=${encodeURIComponent(hostile)}`);
      await wrapper.get('input[name="username"]').setValue('user_01');
      await wrapper.get('input[name="password"]').setValue('correct horse');
      await wrapper.get('form').trigger('submit');
      await flushPromises();
      await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/'), {
        timeout: 5000,
      });
    },
  );

  it('applies the account theme after login', async () => {
    mockApi({
      ...blogListRoutes,
      ...loginRoutes,
      'GET /auth/me': signedOut,
      'POST /auth/login': ok(sessionResponse()),
      'GET /profile': ok(profile({ siteTheme: 'light' })),
      ...homeRoutes,
    });
    const { wrapper } = await mountApp('/login');
    await wrapper.get('input[name="username"]').setValue('user_01');
    await wrapper.get('input[name="password"]').setValue('correct horse');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    await vi.waitFor(() => expect(useThemeStore().theme.id).toBe('clay-light'), {
      timeout: 15_000,
    });
  });

  it('drops cached account data when the session expires', async () => {
    mockApi({
      ...blogListRoutes,
      'GET /auth/me': signedIn(),
      'GET /profile': ok(profile()),
      'POST /submissions/abc/abort': fail(401, 'unauthorized'),
    });
    const { queryClient } = await mountApp('/blog');
    queryClient.setQueryData(['submissions', 'list', { user: 'user_01' }], ['mine']);
    await apiRequest('/submissions/abc/abort', { method: 'POST' }).catch(() => undefined);
    await flushPromises();
    expect(queryClient.getQueryData(['submissions', 'list', { user: 'user_01' }])).toBeUndefined();
  });
});

import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { apiRequest } from '@/api/client';
import { partialSession, profile, sessionResponse, signedIn, signedOut } from '@/test/fixtures';
import { loginRoutes } from '@/test/auth-routes';
import { homeRoutes } from '@/test/home-routes';
import { fail, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { useThemeStore } from '@/theme/theme.store';

describe('auth screens', () => {
  it('returns to a safe redirect after login', async () => {
    const calls = mockApi({
      ...loginRoutes,
      'GET /auth/me': signedOut,
      'POST /auth/login': ok(sessionResponse()),
      'GET /profile': ok(profile()),
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
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/settings'));
  });

  it('shows why a login failed and stays on the page', async () => {
    mockApi({
      ...loginRoutes,
      'GET /auth/me': signedOut,
      'POST /auth/login': fail(401, 'invalid_credentials'),
    });
    const { wrapper, router } = await mountApp('/login');
    await wrapper.get('input[name="username"]').setValue('user_01');
    await wrapper.get('input[name="password"]').setValue('wrong');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('#main [role="alert"]').text()).toBe('Sai tên đăng nhập hoặc mật khẩu.');
    expect(router.currentRoute.value.name).toBe('login');
  });

  it('sends a viewer with a pending second factor to 2FA, keeping the redirect', async () => {
    mockApi({
      ...loginRoutes,
      'GET /auth/me': signedOut,
      'POST /auth/login': ok(partialSession()),
    });
    const { wrapper, router } = await mountApp('/login?redirect=/settings');
    await wrapper.get('input[name="username"]').setValue('user_01');
    await wrapper.get('input[name="password"]').setValue('correct horse');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login-2fa'));
    expect(router.currentRoute.value.query.redirect).toBe('/settings');
  });

  it.each(['//evil.example/x', '/\\evil.example', 'https://evil.example', 'javascript:alert(1)'])(
    'does not follow the hostile redirect %s after login',
    async (hostile) => {
      mockApi({
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
      await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/'));
    },
  );

  it('applies the account theme after login', async () => {
    mockApi({
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
    await vi.waitFor(() => expect(useThemeStore().theme.id).toBe('clay-light'));
  });

  it('tells a throttled viewer to wait', async () => {
    mockApi({
      ...loginRoutes,
      'GET /auth/me': signedOut,
      'POST /auth/login': fail(429, 'rate_limited'),
    });
    const { wrapper } = await mountApp('/login');
    await wrapper.get('input[name="username"]').setValue('user_01');
    await wrapper.get('input[name="password"]').setValue('x');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('#main [role="alert"]').text()).toBe(
      'Bạn thao tác quá nhanh. Hãy thử lại sau.',
    );
  });

  it('drops the previous account data when another account logs in', async () => {
    mockApi({
      ...loginRoutes,
      'GET /auth/me': signedOut,
      'POST /auth/login': ok(sessionResponse()),
      'GET /profile': ok(profile()),
      ...homeRoutes,
    });
    const { wrapper, queryClient } = await mountApp('/login');
    queryClient.setQueryData(['submissions', 'list', { user: 'previous_user' }], ['old']);
    await wrapper.get('input[name="username"]').setValue('user_01');
    await wrapper.get('input[name="password"]').setValue('correct horse');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(
      queryClient.getQueryData(['submissions', 'list', { user: 'previous_user' }]),
    ).toBeUndefined();
  });

  it('drops cached account data when the session expires', async () => {
    mockApi({
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

  it('shows the moderator reason of a banned account', async () => {
    mockApi({
      ...loginRoutes,
      'GET /auth/me': signedOut,
      'POST /auth/login': {
        status: 403,
        body: {
          error: {
            code: 'banned',
            message: 'This account has been banned. Reason: cheating',
            banReason: 'cheating',
          },
        },
      },
    });
    const { wrapper } = await mountApp('/login');
    await wrapper.get('input[name="username"]').setValue('user_01');
    await wrapper.get('input[name="password"]').setValue('x');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('#main [role="alert"]').text()).toBe(
      'Tài khoản đã bị khoá. Lý do: cheating',
    );
  });
});

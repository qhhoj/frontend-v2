import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { apiRequest } from '@/api/client';
import { profile, sessionResponse, signedIn, signedOut } from '@/test/fixtures';
import { fail, mockApi, noContent, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { useThemeStore } from '@/theme/theme.store';

describe('auth screens', () => {
  it('returns to a safe redirect after login', async () => {
    const calls = mockApi({
      'GET /auth/me': signedOut,
      'POST /auth/login': ok(sessionResponse()),
      'GET /profile': ok(profile()),
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
    mockApi({ 'GET /auth/me': signedOut, 'POST /auth/login': fail(401, 'invalid_credentials') });
    const { wrapper, router } = await mountApp('/login');
    await wrapper.get('input[name="username"]').setValue('user_01');
    await wrapper.get('input[name="password"]').setValue('wrong');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toBe('Sai tên đăng nhập hoặc mật khẩu.');
    expect(router.currentRoute.value.name).toBe('login');
  });

  it('sends a viewer with a pending second factor to 2FA, keeping the redirect', async () => {
    mockApi({
      'GET /auth/me': signedOut,
      'POST /auth/login': ok(sessionResponse({ user: null, twoFactorRequired: true })),
    });
    const { wrapper, router } = await mountApp('/login?redirect=/settings');
    await wrapper.get('input[name="username"]').setValue('user_01');
    await wrapper.get('input[name="password"]').setValue('correct horse');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(router.currentRoute.value.name).toBe('login-2fa');
    expect(router.currentRoute.value.query.redirect).toBe('/settings');
  });

  it('registers and tells the viewer to check their mail', async () => {
    const calls = mockApi({ 'GET /auth/me': signedOut, 'POST /auth/register': noContent() });
    const { wrapper } = await mountApp('/register');
    await wrapper.get('input[name="username"]').setValue('new_user');
    await wrapper.get('input[name="email"]').setValue('new@example.com');
    await wrapper.get('input[name="password"]').setValue('long enough password');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(calls.find((call) => call.path === '/auth/register')?.body).toEqual({
      username: 'new_user',
      email: 'new@example.com',
      password: 'long enough password',
    });
    expect(wrapper.get('[role="status"]').text()).toBe(
      'Đã tạo tài khoản. Hãy mở email để kích hoạt.',
    );
    expect(wrapper.find('form').exists()).toBe(false);
  });

  it('shows field errors next to their inputs', async () => {
    mockApi({
      'GET /auth/me': signedOut,
      'POST /auth/register': fail(400, 'validation_failed', {
        username: ['A username must contain letters, numbers, or underscores.'],
      }),
    });
    const { wrapper } = await mountApp('/register');
    await wrapper.get('input[name="username"]').setValue('bad name');
    await wrapper.get('input[name="email"]').setValue('new@example.com');
    await wrapper.get('input[name="password"]').setValue('long enough password');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    const input = wrapper.get('input[name="username"]');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(wrapper.get(`#${input.attributes('aria-describedby')}`).text()).toContain(
      'letters, numbers, or underscores',
    );
  });

  it('activates an account from the mailed link', async () => {
    const calls = mockApi({ 'GET /auth/me': signedOut, 'POST /auth/activate': noContent() });
    const { wrapper, router } = await mountApp('/activate/k123');
    expect(calls.find((call) => call.path === '/auth/activate')?.body).toEqual({ token: 'k123' });
    expect(wrapper.get('[role="status"]').text()).toBe(
      'Tài khoản đã được kích hoạt. Bạn có thể đăng nhập.',
    );
    expect(wrapper.find('main a[href="/login"]').exists()).toBe(true);
    expect(router.currentRoute.value.fullPath).not.toContain('k123');
  });

  it('explains an invalid activation link', async () => {
    mockApi({ 'GET /auth/me': signedOut, 'POST /auth/activate': fail(400, 'invalid_token') });
    const { wrapper } = await mountApp('/activate/expired');
    expect(wrapper.get('[role="alert"]').text()).toBe('Liên kết không hợp lệ hoặc đã hết hạn.');
  });

  it.each(['//evil.example/x', '/\\evil.example', 'https://evil.example', 'javascript:alert(1)'])(
    'does not follow the hostile redirect %s after login',
    async (hostile) => {
      mockApi({
        'GET /auth/me': signedOut,
        'POST /auth/login': ok(sessionResponse()),
        'GET /profile': ok(profile()),
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
      'GET /auth/me': signedOut,
      'POST /auth/login': ok(sessionResponse()),
      'GET /profile': ok(profile({ siteTheme: 'light' })),
    });
    const { wrapper } = await mountApp('/login');
    await wrapper.get('input[name="username"]').setValue('user_01');
    await wrapper.get('input[name="password"]').setValue('correct horse');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    await vi.waitFor(() => expect(useThemeStore().theme.id).toBe('glass-light'));
  });

  it('tells a throttled viewer to wait', async () => {
    mockApi({ 'GET /auth/me': signedOut, 'POST /auth/login': fail(429, 'rate_limited') });
    const { wrapper } = await mountApp('/login');
    await wrapper.get('input[name="username"]').setValue('user_01');
    await wrapper.get('input[name="password"]').setValue('x');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toBe('Bạn thao tác quá nhanh. Hãy thử lại sau.');
  });

  it('drops the previous account data when another account logs in', async () => {
    mockApi({
      'GET /auth/me': signedOut,
      'POST /auth/login': ok(sessionResponse()),
      'GET /profile': ok(profile()),
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
    const { queryClient } = await mountApp('/problems');
    queryClient.setQueryData(['submissions', 'list', { user: 'user_01' }], ['mine']);
    await apiRequest('/submissions/abc/abort', { method: 'POST' }).catch(() => undefined);
    await flushPromises();
    expect(queryClient.getQueryData(['submissions', 'list', { user: 'user_01' }])).toBeUndefined();
  });

  it('shows the moderator reason of a banned account', async () => {
    mockApi({
      'GET /auth/me': signedOut,
      'POST /auth/login': {
        status: 403,
        body: {
          error: { code: 'banned', message: 'This account has been banned. Reason: cheating' },
        },
      },
    });
    const { wrapper } = await mountApp('/login');
    await wrapper.get('input[name="username"]').setValue('user_01');
    await wrapper.get('input[name="password"]').setValue('x');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('Reason: cheating');
  });

  it('keeps a field error out of the input label', async () => {
    mockApi({
      'GET /auth/me': signedOut,
      'POST /auth/register': fail(400, 'validation_failed', {
        email: ['Enter a valid email address.'],
      }),
    });
    const { wrapper } = await mountApp('/register');
    await wrapper.get('input[name="username"]').setValue('new_user');
    await wrapper.get('input[name="email"]').setValue('bad@x');
    await wrapper.get('input[name="password"]').setValue('long enough password');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('label:has(input[name="email"])').text()).toBe('Email');
  });

  it('does not tell a viewer to get a new link when the server failed', async () => {
    mockApi({ 'GET /auth/me': signedOut, 'POST /auth/activate': fail(429, 'rate_limited') });
    const { wrapper } = await mountApp('/activate/k123');
    expect(wrapper.get('[role="alert"]').text()).toBe('Bạn thao tác quá nhanh. Hãy thử lại sau.');
  });
});

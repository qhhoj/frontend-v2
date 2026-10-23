import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { partialSession, signedOut } from '@/test/fixtures';
import { loginRoutes } from '@/test/auth-routes';
import { fail, issue, mockApi, ok } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

// The first mount in a file loads route chunks cold.
vi.setConfig({ testTimeout: 30_000 });

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];

const routes = (overrides: Record<string, MockHandler> = {}) => ({
  'GET /auth/me': signedOut,
  ...loginRoutes,
  ...overrides,
});
const signIn = async (wrapper: Wrapper, password = 'wrong') => {
  await wrapper.get('input[name="username"]').setValue('user_01');
  await wrapper.get('input[name="password"]').setValue(password);
  await wrapper.get('form').trigger('submit');
  await flushPromises();
};

describe('login page', () => {
  it('explains a failed social sign-in carried back in the address, and ignores unknown codes', async () => {
    mockApi(routes());
    const known = (await mountApp('/login?error=oauth_failed')).wrapper;
    expect(known.get('#main [role="alert"]').text()).toBe(
      'Đăng nhập bằng mạng xã hội không thành công.',
    );
    const unknown = (await mountApp('/login?error=constructor')).wrapper;
    expect(unknown.find('#main [role="alert"]').exists()).toBe(false);
  });

  it('confirms a finished password reset, lets the viewer dismiss it, and ignores unknown notices', async () => {
    mockApi(routes());
    const known = (await mountApp('/login?notice=password-reset')).wrapper;
    expect(known.get('#main [role="status"]').text()).toBe(
      'Mật khẩu đã được đổi, hãy đăng nhập lại.',
    );
    await known.get('#main button[aria-label="Đóng thông báo"]').trigger('click');
    expect(known.find('#main [role="status"]').exists()).toBe(false);
    const unknown = (await mountApp('/login?notice=toString')).wrapper;
    expect(unknown.find('#main [role="status"]').exists()).toBe(false);
  });

  it('names an empty field in Vietnamese instead of the browser bubble, and sends nothing', async () => {
    const calls = mockApi(routes());
    const { wrapper } = await mountApp('/login');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('form').attributes('novalidate')).toBeDefined();
    expect(wrapper.text()).toContain('Nhập tên đăng nhập.');
    expect(wrapper.text()).toContain('Nhập mật khẩu.');
    expect(calls.some((call) => call.path === '/auth/login')).toBe(false);
    await wrapper.get('input[name="username"]').setValue('user_01');
    expect(wrapper.text()).not.toContain('Nhập tên đăng nhập.');
  });

  it('says a staff-disabled account is disabled, without the activation link', async () => {
    mockApi(routes({ 'POST /auth/login': fail(403, 'account_disabled') }));
    const { wrapper } = await mountApp('/login');
    await signIn(wrapper);
    expect(wrapper.get('#main [role="alert"]').text()).toContain('vô hiệu hóa');
    expect(wrapper.text()).not.toContain('Gửi lại email kích hoạt');
  });

  it('shows a ban reason with markup as plain text', async () => {
    mockApi(
      routes({
        'POST /auth/login': fail(403, 'banned', undefined, undefined, { banReason: '<b>x</b>' }),
      }),
    );
    const { wrapper } = await mountApp('/login');
    await signIn(wrapper);
    expect(wrapper.get('#main [role="alert"]').text()).toBe(
      'Tài khoản đã bị khóa. Lý do: <b>x</b>',
    );
    expect(wrapper.find('#main [role="alert"] b').exists()).toBe(false);
  });

  it('puts the resend link inside the not-activated alert, from a login or a callback', async () => {
    mockApi(routes({ 'POST /auth/login': fail(403, 'account_not_activated') }));
    const { wrapper } = await mountApp('/login');
    expect(wrapper.find('#main a[href="/activate"]').exists()).toBe(false);
    await signIn(wrapper);
    const alert = wrapper.get('#main [role="alert"]');
    expect(alert.text()).toContain('chưa được kích hoạt');
    expect(alert.get('a[href="/activate"]').text()).toBe('Gửi lại email kích hoạt');

    const callback = (await mountApp('/login?error=account_not_activated')).wrapper;
    expect(callback.find('#main [role="alert"] a[href="/activate"]').exists()).toBe(true);
  });

  it('shows a field issue under its input and focuses that input', async () => {
    mockApi(
      routes({
        'POST /auth/login': fail(400, 'validation_failed', undefined, [
          issue(
            'username',
            'max_length',
            'username must be shorter than or equal to 150 characters',
          ),
        ]),
      }),
    );
    const { wrapper } = await mountApp('/login');
    await wrapper.get('input[name="username"]').setValue('a'.repeat(151));
    await wrapper.get('input[name="password"]').setValue('correct horse');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    const username = wrapper.get('input[name="username"]');
    expect(username.attributes('aria-invalid')).toBe('true');
    expect(wrapper.get(`#${username.attributes('aria-describedby')}`).text()).toBe(
      'username must be shorter than or equal to 150 characters',
    );
    expect(document.activeElement).toBe(username.element);
  });
});

/** Ledger CARRY T6: the step every sign-in ends with (`useAfterSignIn`), exercised through the login form. */
describe('after a sign-in', () => {
  it('sends a pending second factor to the 2FA page carrying the redirect the query had', async () => {
    mockApi(routes({ 'POST /auth/login': ok(partialSession()) }));
    const { wrapper, router } = await mountApp('/login?redirect=/blog');
    await signIn(wrapper, 'correct horse');
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login-2fa'), {
      timeout: 5000,
    });
    expect(router.currentRoute.value.query).toEqual({ redirect: '/blog' });
  });
});

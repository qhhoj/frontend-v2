import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { loginRoutes } from '@/test/auth-routes';
import { partialSession, profile, signedIn, signedOut } from '@/test/fixtures';
import { fail, mockApi, noContent, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { createMemoryHistory } from 'vue-router';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];

const fill = async (wrapper: Wrapper, next = 'brand new passphrase', again = next) => {
  await wrapper.get('input[name="newPassword"]').setValue(next);
  await wrapper.get('input[name="confirmPassword"]').setValue(again);
  await wrapper.get('form').trigger('submit');
  await flushPromises();
};

describe('reset-password page', () => {
  it('saves the new password with the mailed token, drops the token from the address and confirms on sign-in', async () => {
    const calls = mockApi({
      'GET /auth/me': signedOut,
      'POST /auth/password/reset/confirm': noContent(),
      ...loginRoutes,
    });
    const { wrapper, router } = await mountApp('/reset-password/tok-1');
    expect(wrapper.get('h1').text()).toBe('Đặt mật khẩu mới');
    expect(wrapper.get('input[name="newPassword"]').attributes('autocomplete')).toBe(
      'new-password',
    );
    await fill(wrapper);
    expect(calls.find((call) => call.path === '/auth/password/reset/confirm')?.body).toEqual({
      token: 'tok-1',
      newPassword: 'brand new passphrase',
    });
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'));
    await flushPromises();
    expect(router.currentRoute.value.fullPath).not.toContain('tok-1');
    expect(wrapper.get('#main [role="status"]').text()).toBe(
      'Mật khẩu đã được đổi, hãy đăng nhập lại.',
    );
  });

  it('leaves the spent link out of history: after the reset the login address replaces it, never adds an entry', async () => {
    const history = createMemoryHistory();
    const pushed = vi.spyOn(history, 'push');
    const replaced = vi.spyOn(history, 'replace');
    mockApi({
      'GET /auth/me': signedOut,
      'POST /auth/password/reset/confirm': noContent(),
      ...loginRoutes,
    });
    const { wrapper, router } = await mountApp('/reset-password/tok-1', history);
    await fill(wrapper);
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'));
    expect(pushed).not.toHaveBeenCalled();
    expect(replaced.mock.calls.at(-1)?.[0]).toBe('/login?notice=password-reset');
  });

  it('replaces the spent link in the address and history with the dead-link address, and never pushes an entry', async () => {
    const history = createMemoryHistory();
    const pushed = vi.spyOn(history, 'push');
    const replaced = vi.spyOn(history, 'replace');
    mockApi({
      'GET /auth/me': signedOut,
      'POST /auth/password/reset/confirm': fail(400, 'invalid_token'),
    });
    const { wrapper, router } = await mountApp('/reset-password/spent', history);
    await fill(wrapper);
    await vi.waitFor(() =>
      expect(router.currentRoute.value.fullPath).toBe('/reset-password/expired'),
    );
    expect(wrapper.get('h1').text()).toBe('Liên kết không còn hiệu lực');
    expect(pushed).not.toHaveBeenCalled();
    expect(replaced.mock.calls.at(-1)?.[0]).toBe('/reset-password/expired');
  });

  it('lands on sign-in even when the session cannot be reloaded after the reset', async () => {
    let ended = false;
    mockApi({
      'GET /auth/me': () => (ended ? fail(500, 'generic') : signedIn()),
      'GET /profile': ok(profile()),
      'POST /auth/password/reset/confirm': () => {
        ended = true;
        return noContent();
      },
      ...loginRoutes,
    });
    const { wrapper, router } = await mountApp('/reset-password/tok-1');
    await fill(wrapper);
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'));
    expect(wrapper.get('#main [role="status"]').text()).toBe(
      'Mật khẩu đã được đổi, hãy đăng nhập lại.',
    );
  });

  it('opens for a viewer whose second factor is still pending, without sending them to the second-factor step', async () => {
    mockApi({ 'GET /auth/me': signedIn(partialSession()) });
    const { wrapper, router } = await mountApp('/reset-password/tok-1');
    expect(router.currentRoute.value.name).toBe('reset-password');
    expect(wrapper.get('h1').text()).toBe('Đặt mật khẩu mới');
  });
});

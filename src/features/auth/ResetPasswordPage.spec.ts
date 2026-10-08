import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { loginRoutes } from '@/test/auth-routes';
import { partialSession, profile, signedIn, signedOut } from '@/test/fixtures';
import { fail, invalid, issue, mockApi, noContent, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { createMemoryHistory } from 'vue-router';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];

const fill = async (wrapper: Wrapper, next = 'brand new passphrase', again = next) => {
  await wrapper.get('input[name="newPassword"]').setValue(next);
  await wrapper.get('input[name="confirmPassword"]').setValue(again);
  await wrapper.get('form').trigger('submit');
  await flushPromises();
};

const referrerPolicy = () =>
  document.head.querySelector<HTMLMetaElement>('meta[name="referrer"]')?.content;

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

  it('sends no Referer while the token is in the address', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    await mountApp('/reset-password/tok-1');
    expect(referrerPolicy()).toBe('no-referrer');
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

  it('forgets a signed-in session the reset just ended, so the viewer lands on sign-in', async () => {
    let ended = false;
    mockApi({
      'GET /auth/me': () => (ended ? signedOut : signedIn()),
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
  });

  it('replaces the form with the dead-link card and a way to ask again', async () => {
    mockApi({
      'GET /auth/me': signedOut,
      'POST /auth/password/reset/confirm': fail(400, 'invalid_token'),
    });
    const { wrapper } = await mountApp('/reset-password/spent');
    await fill(wrapper);
    expect(wrapper.find('form').exists()).toBe(false);
    expect(wrapper.get('h1').text()).toBe('Liên kết không còn hiệu lực');
    expect(wrapper.get('#main [role="alert"]').text()).toBe(
      'Liên kết đặt lại đã hết hạn hoặc đã được dùng. Hãy yêu cầu liên kết mới.',
    );
    expect(wrapper.get('#main a[href="/forgot-password"]').text()).toBe('Yêu cầu liên kết mới');
  });

  it('explains a breached new password at its input', async () => {
    mockApi({
      'GET /auth/me': signedOut,
      'POST /auth/password/reset/confirm': invalid(
        issue('newPassword', 'password_pwned', 'This password has appeared in a data breach.'),
      ),
    });
    const { wrapper } = await mountApp('/reset-password/tok-1');
    await fill(wrapper);
    const input = wrapper.get('input[name="newPassword"]');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(wrapper.text()).toContain('Mật khẩu này từng bị lộ trong một vụ rò rỉ dữ liệu.');
    expect(document.activeElement).toBe(input.element);
    expect(wrapper.find('form').exists()).toBe(true);
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

  it('shows the dead-link card for the dead-link address without sending anything', async () => {
    const calls = mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/reset-password/expired');
    expect(wrapper.get('h1').text()).toBe('Liên kết không còn hiệu lực');
    expect(wrapper.find('form').exists()).toBe(false);
    expect(calls.some((call) => call.path === '/auth/password/reset/confirm')).toBe(false);
  });

  it('moves focus to the page when the form gives way to the dead-link card', async () => {
    mockApi({
      'GET /auth/me': signedOut,
      'POST /auth/password/reset/confirm': fail(400, 'invalid_token'),
    });
    const { wrapper, router } = await mountApp('/reset-password/spent');
    await fill(wrapper);
    await vi.waitFor(() =>
      expect(router.currentRoute.value.fullPath).toBe('/reset-password/expired'),
    );
    expect(document.activeElement).toBe(document.getElementById('main'));
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

  it('will not send two different passwords', async () => {
    const calls = mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/reset-password/tok-1');
    await fill(wrapper, 'brand new passphrase', 'brand new passphrasX');
    expect(calls.some((call) => call.path === '/auth/password/reset/confirm')).toBe(false);
    expect(document.activeElement).toBe(wrapper.get('input[name="confirmPassword"]').element);
  });
});

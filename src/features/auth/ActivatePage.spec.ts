import { describe, expect, it, vi } from 'vitest';
import { signedOut } from '@/test/fixtures';
import { loginRoutes } from '@/test/auth-routes';
import { fail, hangRequestsExcept, mockApi, noContent } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { useLoadingStore } from '@/stores/loading.store';

const DONE = 'Email của bạn đã được xác nhận. Bạn có thể đăng nhập ngay.';
const referrerPolicy = () =>
  document.head.querySelector<HTMLMetaElement>('meta[name="referrer"]')?.content;

describe('activate page', () => {
  it('shows the success card when the finished page is reloaded, without sending the placeholder as a key', async () => {
    const calls = mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/activate/done');
    expect(calls.some((call) => call.path === '/auth/activate')).toBe(false);
    expect(wrapper.get('h1').text()).toBe('Tài khoản đã kích hoạt');
    expect(wrapper.get('#main [role="status"]').text()).toBe(DONE);
    expect(wrapper.get('#main a[href="/login"]').text()).toBe('Đăng nhập');
  });

  it('activates once, then leaves the key out of the address', async () => {
    const calls = mockApi({ 'GET /auth/me': signedOut, 'POST /auth/activate': noContent() });
    const { wrapper, router } = await mountApp('/activate/k123');
    expect(calls.filter((call) => call.path === '/auth/activate').map((call) => call.body)).toEqual(
      [{ token: 'k123' }],
    );
    expect(router.currentRoute.value.fullPath).toBe('/activate/done');
    expect(wrapper.get('#main [role="status"]').text()).toBe(DONE);
  });

  it('sends no Referer while the key is in the address, and stops once the viewer leaves', async () => {
    mockApi({ 'GET /auth/me': signedOut, 'POST /auth/activate': noContent(), ...loginRoutes });
    const { router } = await mountApp('/activate/k123');
    expect(referrerPolicy()).toBe('no-referrer');
    await router.push('/login');
    expect(referrerPolicy()).toBeUndefined();
  });

  it('waits through the shell, with no loading status of its own, while the key is being checked', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/activate/k123');
    expect(useLoadingStore().isWaiting).toBe(true);
    expect(wrapper.find('#main [role="status"]').exists()).toBe(false);
    expect(wrapper.get('#main').text()).toContain('Đang kích hoạt…');
  });

  it('explains a dead link and sends a new one to the address typed', async () => {
    const calls = mockApi({
      'GET /auth/me': signedOut,
      'POST /auth/activate': fail(400, 'invalid_token'),
      'POST /auth/activate/resend': noContent(),
    });
    const { wrapper } = await mountApp('/activate/expired');
    expect(wrapper.get('h1').text()).toBe('Liên kết đã hết hạn');
    expect(wrapper.get('#main [role="alert"]').text()).toBe(
      'Liên kết kích hoạt chỉ dùng được trong 7 ngày. Nhập email để nhận liên kết mới.',
    );
    await wrapper.get('input[name="email"]').setValue('user_01@example.com');
    await wrapper.get('form').trigger('submit');
    await vi.waitFor(() =>
      expect(calls.find((call) => call.path === '/auth/activate/resend')?.body).toEqual({
        email: 'user_01@example.com',
      }),
    );
    await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe('Kiểm tra hộp thư'));
    expect(wrapper.get('#main [role="status"]').text()).toContain('u***@example.com');
  });

  it('does not tell a viewer to get a new link when the server failed', async () => {
    mockApi({ 'GET /auth/me': signedOut, 'POST /auth/activate': fail(429, 'rate_limited') });
    const { wrapper } = await mountApp('/activate/k123');
    expect(wrapper.get('#main [role="alert"]').text()).toBe(
      'Bạn thao tác quá nhanh. Hãy thử lại sau.',
    );
    expect(wrapper.find('input[name="email"]').exists()).toBe(false);
  });
});

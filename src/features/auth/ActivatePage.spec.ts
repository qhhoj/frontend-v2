import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryHistory } from 'vue-router';
import { signedOut } from '@/test/fixtures';
import { fail, mockApi, noContent, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const DONE = 'Email của bạn đã được xác nhận. Bạn có thể đăng nhập ngay.';

describe('activate page', () => {
  it('shows the success card when the finished page is reloaded, without sending the placeholder as a key', async () => {
    const calls = mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/activate/done');
    expect(calls.some((call) => call.path === '/auth/activate')).toBe(false);
    expect(wrapper.get('h1').text()).toBe('Tài khoản đã kích hoạt');
    expect(wrapper.get('#main [role="status"]').text()).toBe(DONE);
    expect(wrapper.get('#main a[href="/login"]').text()).toBe('Đăng nhập');
  });

  it('activates once, then replaces the used key with the done address, never adding a history entry', async () => {
    const history = createMemoryHistory();
    const pushed = vi.spyOn(history, 'push');
    const replaced = vi.spyOn(history, 'replace');
    const calls = mockApi({ 'GET /auth/me': signedOut, 'POST /auth/activate': noContent() });
    await mountApp('/activate/k123', history);
    expect(calls.filter((call) => call.path === '/auth/activate').map((call) => call.body)).toEqual(
      [{ token: 'k123' }],
    );
    expect(pushed).not.toHaveBeenCalled();
    expect(replaced.mock.calls.at(-1)?.[0]).toBe('/activate/done');
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

  it('lets the viewer try a still-valid key again after a throttled attempt', async () => {
    const calls = mockApi({
      'GET /auth/me': signedOut,
      'POST /auth/activate': sequence(fail(429, 'rate_limited'), noContent()),
    });
    const { wrapper } = await mountApp('/activate/k123');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Thử lại')!
      .trigger('click');
    await flushPromises();
    expect(calls.filter((call) => call.path === '/auth/activate')).toHaveLength(2);
    expect(wrapper.get('h1').text()).toBe('Tài khoản đã kích hoạt');
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

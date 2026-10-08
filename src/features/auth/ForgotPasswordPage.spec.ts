import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { signedOut } from '@/test/fixtures';
import { fail, invalid, issue, mockApi, noContent } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];

const forgotApi = (reply: MockHandler = noContent()) =>
  mockApi({ 'GET /auth/me': signedOut, 'POST /auth/password/reset': reply });

const send = async (wrapper: Wrapper, email = 'user_01@example.com') => {
  await wrapper.get('input[name="email"]').setValue(email);
  await wrapper.get('form').trigger('submit');
  await flushPromises();
};

describe('forgot-password page', () => {
  it('asks for an email and shows the masked answer, never whether the account exists', async () => {
    const calls = forgotApi();
    const { wrapper } = await mountApp('/forgot-password');
    expect(wrapper.get('h1').text()).toBe('Quên mật khẩu?');
    const email = wrapper.get('input[name="email"]');
    expect(email.attributes('type')).toBe('email');
    expect(email.attributes('autocomplete')).toBe('email');
    await send(wrapper);
    expect(calls.find((call) => call.path === '/auth/password/reset')?.body).toEqual({
      email: 'user_01@example.com',
    });
    expect(wrapper.get('h1').text()).toBe('Kiểm tra hộp thư');
    expect(wrapper.get('#main [role="status"]').text()).toBe(
      'Nếu u***@example.com có tài khoản, bạn sẽ nhận được liên kết đặt lại trong vài phút.',
    );
    expect(wrapper.find('form').exists()).toBe(false);
  });

  it('keeps the form and announces a throttled request', async () => {
    forgotApi(fail(429, 'rate_limited'));
    const { wrapper } = await mountApp('/forgot-password');
    await send(wrapper);
    expect(wrapper.get('#main [role="alert"]').text()).toBe(
      'Bạn thao tác quá nhanh. Hãy thử lại sau.',
    );
    expect(wrapper.find('form').exists()).toBe(true);
  });

  it('shows a rejected address at the input and focuses it', async () => {
    // The reset email's issue carries the bare constraint name `matches` (ask A1); `auth-errors.ts` aliases it.
    forgotApi(invalid(issue('email', 'matches', 'Enter a valid email address.')));
    const { wrapper } = await mountApp('/forgot-password');
    await send(wrapper, 'nope@x');
    const email = wrapper.get('input[name="email"]');
    expect(email.attributes('aria-invalid')).toBe('true');
    expect(wrapper.text()).toContain('Nhập một địa chỉ email hợp lệ.');
    expect(document.activeElement).toBe(email.element);
  });

  it('links back to sign-in before and after sending', async () => {
    forgotApi();
    const { wrapper } = await mountApp('/forgot-password');
    expect(wrapper.get('#main a[href="/login"]').text()).toBe('Quay lại đăng nhập');
    await send(wrapper);
    expect(wrapper.get('#main a[href="/login"]').text()).toBe('Quay lại đăng nhập');
  });
});

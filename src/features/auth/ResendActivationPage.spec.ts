import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { signedOut } from '@/test/fixtures';
import { mockApi, noContent } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const send = async (
  wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'],
  email = 'user_01@example.com',
) => {
  await wrapper.get('input[name="email"]').setValue(email);
  await wrapper.get('form').trigger('submit');
  await flushPromises();
};

describe('resend-activation page', () => {
  it('sends the address and answers the same way whatever the backend knows', async () => {
    const calls = mockApi({ 'GET /auth/me': signedOut, 'POST /auth/activate/resend': noContent() });
    const { wrapper } = await mountApp('/activate');
    const email = wrapper.get('input[name="email"]');
    expect(email.attributes('type')).toBe('email');
    expect(email.attributes('autocomplete')).toBe('email');
    await send(wrapper);
    expect(calls.find((call) => call.path === '/auth/activate/resend')?.body).toEqual({
      email: 'user_01@example.com',
    });
    expect(wrapper.get('h1').text()).toBe('Kiểm tra hộp thư');
    expect(wrapper.get('#main [role="status"]').text()).toBe(
      'Nếu u***@example.com đang chờ kích hoạt, bạn sẽ nhận được liên kết mới trong vài phút.',
    );
    expect(document.activeElement).toBe(document.getElementById('main'));
  });
});

import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import { signedOut } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import InboxNotice from './InboxNotice.vue';

const mountNotice = (resend: () => Promise<unknown>) =>
  mountComponent(InboxNotice, { props: { resend }, slots: { default: 'Sent to m***@gmail.com' } });
const button = (wrapper: ReturnType<typeof mountNotice>) => wrapper.get('button');

describe('InboxNotice', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    mockApi({ 'GET /auth/me': signedOut }); // `mountComponent` installs the router
  });
  afterEach(() => void vi.useRealTimers());

  it('says where the mail went, as a status', () => {
    const wrapper = mountNotice(vi.fn());
    expect(wrapper.get('[role="status"]').text()).toBe('Sent to m***@gmail.com');
  });

  it('cools down after the mail that was just sent, and a click then sends nothing', async () => {
    const resend = vi.fn(() => Promise.resolve());
    const wrapper = mountNotice(resend);
    expect(button(wrapper).text()).toBe('Gửi lại sau 1:00');
    expect(button(wrapper).attributes('aria-disabled')).toBe('true');
    await button(wrapper).trigger('click');
    expect(resend).not.toHaveBeenCalled();
  });

  it('sends again once the cooldown is over, says so, and cools down again', async () => {
    const resend = vi.fn(() => Promise.resolve());
    const wrapper = mountNotice(resend);
    vi.advanceTimersByTime(60_000);
    await flushPromises();
    expect(button(wrapper).text()).toBe('Gửi lại email');
    await button(wrapper).trigger('click');
    await flushPromises();
    expect(resend).toHaveBeenCalledTimes(1);
    expect(wrapper.get('[role="status"]').text()).toContain('Đã gửi lại.');
    expect(button(wrapper).attributes('aria-disabled')).toBe('true');
  });

  it('announces a refused resend and lets the viewer try again at once', async () => {
    const resend = vi.fn(() => Promise.reject(new ApiError('rate_limited', 429, 'Too many')));
    const wrapper = mountNotice(resend);
    vi.advanceTimersByTime(60_000);
    await flushPromises();
    await button(wrapper).trigger('click');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toBe('Bạn thao tác quá nhanh. Hãy thử lại sau.');
    expect(wrapper.get('[role="status"]').text()).not.toContain('Đã gửi lại.');
    expect(button(wrapper).attributes('aria-disabled')).toBeUndefined();
  });
});

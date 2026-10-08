import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { useLoadingStore } from '@/stores/loading.store';
import { signedOut } from '@/test/fixtures';
import { fail, hangRequestsExcept, mockApi, ok } from '@/test/mock-api';
import type { MockResponse } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import SocialButtons from './SocialButtons.vue';

/** `mountComponent` installs the router, whose first navigation asks `/auth/me`. */
const mockProviders = (reply: MockResponse) =>
  mockApi({ 'GET /auth/me': signedOut, 'GET /auth/social/providers': reply });
const mountButtons = async (mode: 'login' | 'register') => {
  const wrapper = mountComponent(SocialButtons, { props: { mode } });
  await flushPromises();
  return wrapper;
};

describe('SocialButtons', () => {
  it('links each provider the backend enables to its start endpoint as a full page navigation', async () => {
    mockProviders(ok({ providers: ['google', 'github'] }));
    const wrapper = await mountButtons('login');
    expect(wrapper.findAll('a').map((link) => link.attributes('href'))).toEqual([
      '/api/internal/auth/social/google/start',
      '/api/internal/auth/social/github/start',
    ]);
  });

  it('offers only what the backend lists, so a disabled provider has no button', async () => {
    mockProviders(ok({ providers: ['github'] }));
    const wrapper = await mountButtons('login');
    expect(wrapper.findAll('a').map((link) => link.text())).toEqual(['GitHub']);
  });

  it('labels sign-in buttons by provider with a fuller accessible name and a divider', async () => {
    mockProviders(ok({ providers: ['google'] }));
    const wrapper = await mountButtons('login');
    const link = wrapper.get('a');
    expect(link.text()).toBe('Google');
    expect(link.attributes('aria-label')).toBe('Đăng nhập với Google');
    expect(wrapper.text()).toContain('hoặc tiếp tục với');
  });

  it('labels sign-up buttons in full and has no divider', async () => {
    mockProviders(ok({ providers: ['github'] }));
    const wrapper = await mountButtons('register');
    expect(wrapper.get('a').text()).toBe('Đăng ký với GitHub');
    expect(wrapper.text()).not.toContain('hoặc tiếp tục với');
  });

  it('holds the space with inert blocks while the list loads, without registering a wait', async () => {
    mockProviders(ok({ providers: ['google'] }));
    hangRequestsExcept(['/auth/me']);
    const wrapper = mountComponent(SocialButtons, { props: { mode: 'login' } });
    await wrapper.vm.$router.isReady(); // the router's first navigation is a wait of its own; let it end
    const skeleton = wrapper.get('[data-testid="social-skeleton"]');
    expect(skeleton.attributes('aria-hidden')).toBe('true');
    expect(wrapper.find('a').exists()).toBe(false);
    expect(useLoadingStore().isWaiting).toBe(false);
  });

  it.each([
    ['no provider is enabled', ok({ providers: [] })],
    [
      'the request fails (a 4xx is final; a 5xx would be retried after a second)',
      fail(404, 'not_found'),
    ],
  ])('renders nothing, and no alert, when %s', async (_name, reply) => {
    mockProviders(reply);
    const wrapper = await mountButtons('login');
    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.find('[data-testid="social-skeleton"]').exists()).toBe(false);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.text()).toBe('');
  });
});

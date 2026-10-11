import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { signedOut } from '@/test/fixtures';
import { fail, mockApi, ok } from '@/test/mock-api';
import type { MockResponse } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import SocialButtons from './SocialButtons.vue';

/** `mountComponent` installs the router, whose first navigation asks `/auth/me`. */
const mockProviders = (reply: MockResponse) =>
  mockApi({ 'GET /auth/me': signedOut, 'GET /auth/social/providers': reply });
const mountButtons = async () => {
  const wrapper = mountComponent(SocialButtons);
  await flushPromises();
  return wrapper;
};

describe('SocialButtons', () => {
  it('links each provider the backend enables to its start endpoint as a full page navigation', async () => {
    mockProviders(ok({ providers: ['google', 'github'] }));
    const wrapper = await mountButtons();
    expect(wrapper.findAll('a').map((link) => link.attributes('href'))).toEqual([
      '/api/internal/auth/social/google/start',
      '/api/internal/auth/social/github/start',
    ]);
  });

  it.each([
    ['no provider is enabled', ok({ providers: [] })],
    [
      'the request fails (a 4xx is final; a 5xx would be retried after a second)',
      fail(404, 'not_found'),
    ],
  ])('renders nothing, and no alert, when %s', async (_name, reply) => {
    mockProviders(reply);
    const wrapper = await mountButtons();
    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.find('[data-testid="social-skeleton"]').exists()).toBe(false);
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.text()).toBe('');
  });
});

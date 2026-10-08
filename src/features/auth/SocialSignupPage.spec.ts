import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryHistory } from 'vue-router';
import {
  CPP17_ID,
  organizationItem,
  problemMeta,
  profile,
  sessionResponse,
  signedOut,
} from '@/test/fixtures';
import { registerRoutes } from '@/test/auth-routes';
import { fail, invalid, issue, mockApi, ok, page } from '@/test/mock-api';
import { blogListRoutes } from '@/test/community-routes';
import type { MockHandler } from '@/test/mock-api';
import { homeRoutes } from '@/test/home-routes';
import { mountApp } from '@/test/mount';
import { openSelect, pickOption } from '@/test/select';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];
const PASSWORD = 'long enough password';

const routes = (
  complete: MockHandler = ok(sessionResponse()),
  overrides: Record<string, MockHandler> = {},
) =>
  mockApi({
    ...blogListRoutes,
    'GET /auth/me': signedOut,
    ...registerRoutes,
    ...homeRoutes,
    'POST /auth/social/complete': complete,
    'GET /profile': ok(profile()),
    ...overrides,
  });
const submit = async (wrapper: Wrapper, username = 'new_user', password = PASSWORD) => {
  await wrapper.get('input[name="username"]').setValue(username);
  await wrapper.get('input[name="password"]').setValue(password);
  await wrapper.get('form').trigger('submit');
  await flushPromises();
};
const completedBodies = (calls: ReturnType<typeof routes>) =>
  calls.filter((call) => call.path === '/auth/social/complete').map((call) => call.body);

describe('social signup page', () => {
  it('finishes the signup with the pending token and the C++17 default, then signs the viewer in', async () => {
    const calls = routes();
    const { wrapper, router } = await mountApp('/register/social?token=pending-1&redirect=/blog');
    expect(wrapper.get('h1').text()).toBe('Hoàn tất đăng ký');
    await submit(wrapper);
    expect(completedBodies(calls)).toEqual([
      { token: 'pending-1', username: 'new_user', password: PASSWORD, languageId: CPP17_ID },
    ]);
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/blog'));
  });

  it('sends no language when the list has no C++17, and the picker says "Chưa chọn"', async () => {
    const meta = problemMeta();
    const calls = routes(ok(sessionResponse()), {
      'GET /problems/meta': ok({
        ...meta,
        languages: meta.languages.filter((language) => language.key !== 'CPP17'),
      }),
    });
    const { wrapper } = await mountApp('/register/social?token=pending-1');
    expect(wrapper.get('select[name="languageId"]').element).toHaveProperty('value', '');
    await submit(wrapper);
    expect(completedBodies(calls)).toEqual([
      { token: 'pending-1', username: 'new_user', password: PASSWORD },
    ]);
  });

  it('sends the school when chosen', async () => {
    const calls = routes();
    const { wrapper } = await mountApp('/register/social?token=pending-1');
    await openSelect(wrapper, '[data-testid="school-picker"]');
    await pickOption(organizationItem().name);
    await submit(wrapper);
    expect(completedBodies(calls)).toEqual([
      {
        token: 'pending-1',
        username: 'new_user',
        password: PASSWORD,
        organizationId: organizationItem().id,
        languageId: CPP17_ID,
      },
    ]);
  });

  it('takes the token out of the address bar once it is read', async () => {
    routes();
    const { router } = await mountApp('/register/social?token=pending-1&redirect=/blog');
    expect(router.currentRoute.value.query).toEqual({ redirect: '/blog' });
  });

  it('replaces the token-bearing entry rather than pushing a second one, so Back never shows the token', async () => {
    routes();
    const history = createMemoryHistory();
    const push = vi.spyOn(history, 'push');
    const replace = vi.spyOn(history, 'replace');
    await mountApp('/register/social?token=pending-1&redirect=/blog', history);
    // The first navigation is a replace (no previous page), so an extra push can only come from the token removal.
    expect(push).not.toHaveBeenCalled();
    expect(String(replace.mock.calls.at(-1)?.[0])).toBe('/register/social?redirect=/blog');
  });

  it('sends no referrer from its first request on, so the token never leaves the page', async () => {
    const policiesSeen: (string | undefined)[] = [];
    routes(ok(sessionResponse()), {
      'GET /organizations': () => {
        policiesSeen.push(
          document.head.querySelector<HTMLMetaElement>('meta[name="referrer"]')?.content,
        );
        return page([organizationItem()]);
      },
    });
    await mountApp('/register/social?token=pending-1');
    expect(policiesSeen).toEqual(['no-referrer']);
  });

  it('asks for a username, a password and the optional pickers, never for an email', async () => {
    routes();
    const { wrapper } = await mountApp('/register/social?token=pending-1');
    expect(wrapper.find('input[name="email"]').exists()).toBe(false);
    expect(wrapper.get('input[name="username"]').attributes('autocomplete')).toBe('username');
    expect(wrapper.get('input[name="password"]').attributes('autocomplete')).toBe('new-password');
    expect(wrapper.find('[role="meter"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="school-picker"]').exists()).toBe(true);
    expect(wrapper.find('select[name="languageId"]').exists()).toBe(true);
    expect(wrapper.get('form button[type="submit"]').text()).toBe('Tạo tài khoản');
  });

  it('says so, and offers sign-in, when the address carries no token', async () => {
    const calls = routes();
    const { wrapper } = await mountApp('/register/social');
    expect(wrapper.find('form').exists()).toBe(false);
    expect(wrapper.get('#main [role="alert"]').text()).toBe(
      'Liên kết không hợp lệ hoặc đã hết hạn.',
    );
    expect(wrapper.find('#main a[href="/login"]').exists()).toBe(true);
    expect(calls.some((call) => call.path === '/auth/social/complete')).toBe(false);
  });

  it('replaces the form with the way out when the backend refuses the token', async () => {
    routes(fail(400, 'invalid_token'));
    const { wrapper } = await mountApp('/register/social?token=spent');
    await submit(wrapper);
    expect(wrapper.find('form').exists()).toBe(false);
    expect(wrapper.get('#main [role="alert"]').text()).toBe(
      'Liên kết không hợp lệ hoặc đã hết hạn.',
    );
    expect(wrapper.find('#main a[href="/login"]').exists()).toBe(true);
    expect(document.activeElement).toBe(document.getElementById('main'));
  });

  it('keeps the form and the token when the username is taken, and shows it at the input', async () => {
    const calls = routes(invalid(issue('username', 'username_taken', 'Username is taken.')));
    const { wrapper } = await mountApp('/register/social?token=pending-1');
    await submit(wrapper);
    const username = wrapper.get('input[name="username"]');
    expect(username.attributes('aria-invalid')).toBe('true');
    expect(wrapper.text()).toContain('Tên đăng nhập đã được dùng.');
    expect(document.activeElement).toBe(username.element);
    await submit(wrapper, 'another_name');
    const bodies = completedBodies(calls);
    expect(bodies).toHaveLength(2);
    expect(bodies[1]).toMatchObject({ token: 'pending-1', username: 'another_name' });
  });

  it('ends with the provider email already registered, and offers sign-in and password reset', async () => {
    routes(invalid(issue('email', 'email_taken', 'Email is already registered.')));
    const { wrapper } = await mountApp('/register/social?token=pending-1');
    await submit(wrapper);
    expect(wrapper.get('#main [role="alert"]').text()).toBe(
      'Email này đã được đăng ký. Hãy đăng nhập hoặc đặt lại mật khẩu.',
    );
    expect(wrapper.find('form').exists()).toBe(false);
    expect(wrapper.find('#main a[href="/login"]').exists()).toBe(true);
    expect(wrapper.find('#main a[href="/forgot-password"]').exists()).toBe(true);
    expect(document.activeElement).toBe(document.getElementById('main'));
  });

  it('ends with the identity already linked, and sends the viewer to sign in', async () => {
    routes(fail(409, 'conflict'));
    const { wrapper } = await mountApp('/register/social?token=pending-1');
    await submit(wrapper);
    expect(wrapper.get('#main [role="alert"]').text()).toBe(
      'Tài khoản mạng xã hội này đã được liên kết với một tài khoản QHHOJ. Hãy đăng nhập.',
    );
    expect(wrapper.find('form').exists()).toBe(false);
    expect(wrapper.find('#main a[href="/login"]').exists()).toBe(true);
  });

  it('will not send a username the backend would reject', async () => {
    const calls = routes();
    const { wrapper } = await mountApp('/register/social?token=pending-1');
    await submit(wrapper, 'bad name');
    expect(completedBodies(calls)).toEqual([]);
    expect(document.activeElement).toBe(wrapper.get('input[name="username"]').element);
  });
});

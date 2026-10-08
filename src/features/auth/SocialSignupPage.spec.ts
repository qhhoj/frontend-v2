import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import {
  CPP17_ID,
  organizationItem,
  problemMeta,
  profile,
  sessionResponse,
  signedOut,
} from '@/test/fixtures';
import { registerRoutes } from '@/test/auth-routes';
import { fail, invalid, issue, mockApi, ok } from '@/test/mock-api';
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

  it('explains in the summary that the provider email is already registered, since it has no input here', async () => {
    routes(invalid(issue('email', 'email_taken', 'Email is already registered.')));
    const { wrapper } = await mountApp('/register/social?token=pending-1');
    await submit(wrapper);
    expect(wrapper.get('#main [role="alert"]').text()).toBe(
      'Email này đã được đăng ký. Hãy đăng nhập hoặc đặt lại mật khẩu.',
    );
    expect(wrapper.find('form').exists()).toBe(true);
  });

  it('explains an identity that was linked meanwhile', async () => {
    routes(fail(409, 'conflict'));
    const { wrapper } = await mountApp('/register/social?token=pending-1');
    await submit(wrapper);
    expect(wrapper.get('#main [role="alert"]').text()).toBe(
      'Thao tác không thực hiện được do trạng thái hiện tại. Hãy tải lại và thử lại.',
    );
  });

  it('will not send a username the backend would reject', async () => {
    const calls = routes();
    const { wrapper } = await mountApp('/register/social?token=pending-1');
    await submit(wrapper, 'bad name');
    expect(completedBodies(calls)).toEqual([]);
    expect(document.activeElement).toBe(wrapper.get('input[name="username"]').element);
  });
});

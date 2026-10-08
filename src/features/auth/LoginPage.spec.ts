import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { partialSession, profile, sessionResponse, signedIn, signedOut } from '@/test/fixtures';
import { loginRoutes } from '@/test/auth-routes';
import { homeRoutes } from '@/test/home-routes';
import { fail, hangRequestsExcept, issue, mockApi, ok } from '@/test/mock-api';
import { blogListRoutes } from '@/test/community-routes';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { useLoadingStore } from '@/stores/loading.store';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];

const routes = (overrides: Record<string, MockHandler> = {}) => ({
  'GET /auth/me': signedOut,
  ...loginRoutes,
  ...overrides,
});
const countsOf = (wrapper: Wrapper) => wrapper.get('[data-testid="site-counts"]');
const signIn = async (wrapper: Wrapper, password = 'wrong') => {
  await wrapper.get('input[name="username"]').setValue('user_01');
  await wrapper.get('input[name="password"]').setValue(password);
  await wrapper.get('form').trigger('submit');
  await flushPromises();
};

describe('login page', () => {
  it('is one page with a single h1, labelled inputs and the links around the form', async () => {
    mockApi(routes());
    const { wrapper } = await mountApp('/login');
    expect(wrapper.findAll('h1').map((heading) => heading.text())).toEqual(['Đăng nhập']);
    const username = wrapper.get('input[name="username"]');
    const password = wrapper.get('input[name="password"]');
    expect(wrapper.get(`label[for="${username.attributes('id')}"]`).text()).toBe('Tên đăng nhập');
    expect(wrapper.get(`label[for="${password.attributes('id')}"]`).text()).toBe('Mật khẩu');
    expect(username.attributes('autocomplete')).toBe('username');
    expect(password.attributes('autocomplete')).toBe('current-password');
    expect(wrapper.get('#main a[href="/register"]').text()).toBe('Đăng ký');
    expect(wrapper.get('#main a[href="/forgot-password"]').text()).toBe('Quên mật khẩu?');
  });

  it('shows the brand headline as text, not as a second heading', async () => {
    mockApi(routes());
    const { wrapper } = await mountApp('/login');
    expect(wrapper.text()).toContain('Luyện thuật toán mỗi ngày, cùng Bit.');
  });

  it('offers the social providers the backend enables, as page navigations', async () => {
    mockApi(routes({ 'GET /auth/social/providers': ok({ providers: ['github'] }) }));
    const { wrapper } = await mountApp('/login');
    const hrefs = wrapper
      .findAll('a[href^="/api/internal/auth/social/"]')
      .map((link) => link.attributes('href'));
    expect(hrefs).toEqual(['/api/internal/auth/social/github/start']);
  });

  it('shows the problem and member counts from one request', async () => {
    const calls = mockApi(routes());
    const { wrapper } = await mountApp('/login');
    expect(countsOf(wrapper).text()).toBe('412 bài · 905 thành viên');
    expect(calls.filter((call) => call.path === '/home')).toHaveLength(1);
  });

  it('holds the counts with a block while they load, registers no wait, and the form works at once', async () => {
    mockApi(routes());
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/login');
    expect(countsOf(wrapper).find('[data-skeleton]').exists()).toBe(true);
    expect(wrapper.find('input[name="username"]').exists()).toBe(true);
    expect(wrapper.find('#main [role="alert"]').exists()).toBe(false);
    expect(useLoadingStore().isWaiting).toBe(false);
  });

  it('leaves the counts line empty instead of showing an error when they cannot load', async () => {
    mockApi(routes({ 'GET /home': fail(500, 'internal_error') }));
    const { wrapper } = await mountApp('/login');
    expect(countsOf(wrapper).text()).toBe('');
    expect(wrapper.find('#main [role="alert"]').exists()).toBe(false);
    expect(wrapper.find('form').exists()).toBe(true);
  });

  it('explains a failed social sign-in carried back in the address, and ignores unknown codes', async () => {
    mockApi(routes());
    const known = (await mountApp('/login?error=oauth_failed')).wrapper;
    expect(known.get('#main [role="alert"]').text()).toBe(
      'Đăng nhập bằng mạng xã hội không thành công.',
    );
    const unknown = (await mountApp('/login?error=constructor')).wrapper;
    expect(unknown.find('#main [role="alert"]').exists()).toBe(false);
  });

  it('confirms a finished password reset, lets the viewer dismiss it, and ignores unknown notices', async () => {
    mockApi(routes());
    const known = (await mountApp('/login?notice=password-reset')).wrapper;
    expect(known.get('#main [role="status"]').text()).toBe(
      'Mật khẩu đã được đổi, hãy đăng nhập lại.',
    );
    await known.get('#main button[aria-label="Đóng thông báo"]').trigger('click');
    expect(known.find('#main [role="status"]').exists()).toBe(false);
    const unknown = (await mountApp('/login?notice=toString')).wrapper;
    expect(unknown.find('#main [role="status"]').exists()).toBe(false);
  });

  it('keeps what was typed after a failed sign-in', async () => {
    mockApi(routes({ 'POST /auth/login': fail(401, 'invalid_credentials') }));
    const { wrapper } = await mountApp('/login');
    await signIn(wrapper);
    expect((wrapper.get('input[name="username"]').element as HTMLInputElement).value).toBe(
      'user_01',
    );
    expect(wrapper.get('#main [role="alert"]').text()).toBe('Sai tên đăng nhập hoặc mật khẩu.');
  });

  it('shows the failure of this attempt over the social error that brought the viewer here', async () => {
    mockApi(routes({ 'POST /auth/login': fail(401, 'invalid_credentials') }));
    const { wrapper } = await mountApp('/login?error=oauth_failed');
    await signIn(wrapper);
    expect(wrapper.get('#main [role="alert"]').text()).toBe('Sai tên đăng nhập hoặc mật khẩu.');
  });

  it('shows a ban reason with markup as plain text', async () => {
    mockApi(
      routes({
        'POST /auth/login': fail(403, 'banned', undefined, undefined, { banReason: '<b>x</b>' }),
      }),
    );
    const { wrapper } = await mountApp('/login');
    await signIn(wrapper);
    expect(wrapper.get('#main [role="alert"]').text()).toBe(
      'Tài khoản đã bị khoá. Lý do: <b>x</b>',
    );
    expect(wrapper.find('#main [role="alert"] b').exists()).toBe(false);
  });

  it('shows the structured ban reason, not the English message', async () => {
    mockApi(
      routes({
        'POST /auth/login': fail(403, 'banned', undefined, undefined, {
          banReason: 'cheating in R41',
        }),
      }),
    );
    const { wrapper } = await mountApp('/login');
    await signIn(wrapper);
    expect(wrapper.get('#main [role="alert"]').text()).toBe(
      'Tài khoản đã bị khoá. Lý do: cheating in R41',
    );
  });

  it('puts the resend link inside the not-activated alert, from a login or a callback', async () => {
    mockApi(routes({ 'POST /auth/login': fail(403, 'account_not_activated') }));
    const { wrapper } = await mountApp('/login');
    expect(wrapper.find('#main a[href="/activate"]').exists()).toBe(false);
    await signIn(wrapper);
    const alert = wrapper.get('#main [role="alert"]');
    expect(alert.text()).toContain('chưa được kích hoạt');
    expect(alert.get('a[href="/activate"]').text()).toBe('Gửi lại email kích hoạt');

    const callback = (await mountApp('/login?error=account_not_activated')).wrapper;
    expect(callback.find('#main [role="alert"] a[href="/activate"]').exists()).toBe(true);
  });

  it('shows a field issue under its input and focuses that input', async () => {
    mockApi(
      routes({
        'POST /auth/login': fail(400, 'validation_failed', undefined, [
          issue(
            'username',
            'max_length',
            'username must be shorter than or equal to 150 characters',
          ),
        ]),
      }),
    );
    const { wrapper } = await mountApp('/login');
    await wrapper.get('input[name="username"]').setValue('a'.repeat(151));
    await wrapper.get('input[name="password"]').setValue('correct horse');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    const username = wrapper.get('input[name="username"]');
    expect(username.attributes('aria-invalid')).toBe('true');
    expect(wrapper.get(`#${username.attributes('aria-describedby')}`).text()).toBe(
      'username must be shorter than or equal to 150 characters',
    );
    expect(document.activeElement).toBe(username.element);
  });

  it('clears a field issue once the viewer edits that field', async () => {
    mockApi(
      routes({
        'POST /auth/login': fail(400, 'validation_failed', undefined, [
          issue('username', 'max_length', 'too long'),
        ]),
      }),
    );
    const { wrapper } = await mountApp('/login');
    await signIn(wrapper, 'correct horse');
    await wrapper.get('input[name="username"]').setValue('user_01');
    expect(wrapper.get('input[name="username"]').attributes('aria-invalid')).toBeUndefined();
  });

  it('does not offer a resend for other failures', async () => {
    mockApi(routes({ 'POST /auth/login': fail(401, 'invalid_credentials') }));
    const { wrapper } = await mountApp('/login');
    await signIn(wrapper);
    expect(wrapper.find('#main a[href="/activate"]').exists()).toBe(false);
  });
});

/** Ledger CARRY T6: the step every sign-in ends with (`useAfterSignIn`), exercised through the login form. */
describe('after a sign-in', () => {
  /** Signed out until the password is accepted, then a full session landing on the signed-in home page. */
  const signedInRoutes = () => {
    let signedInNow = false;
    return mockApi({
      ...blogListRoutes,
      ...routes(),
      ...homeRoutes,
      'GET /profile': ok(profile()),
      'GET /auth/me': () => (signedInNow ? signedIn() : signedOut),
      'POST /auth/login': () => {
        signedInNow = true;
        return ok(sessionResponse());
      },
    });
  };

  it('ignores an off-site redirect and lands home', async () => {
    signedInRoutes();
    const { wrapper, router } = await mountApp(
      `/login?redirect=${encodeURIComponent('//evil.example')}`,
    );
    await signIn(wrapper, 'correct horse');
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('home'));
  });

  it('sends a pending second factor to the 2FA page carrying the redirect the query had', async () => {
    mockApi(routes({ 'POST /auth/login': ok(partialSession()) }));
    const { wrapper, router } = await mountApp('/login?redirect=/blog');
    await signIn(wrapper, 'correct horse');
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login-2fa'));
    expect(router.currentRoute.value.query).toEqual({ redirect: '/blog' });
  });

  it('carries no redirect to the 2FA page when the query had none', async () => {
    mockApi(routes({ 'POST /auth/login': ok(partialSession()) }));
    const { wrapper, router } = await mountApp('/login');
    await signIn(wrapper, 'correct horse');
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login-2fa'));
    expect(router.currentRoute.value.query).toEqual({});
  });

  it("drops the previous account's cached data", async () => {
    signedInRoutes();
    const { wrapper, queryClient } = await mountApp('/login');
    queryClient.setQueryData(['submissions', 'previous-account'], { items: ['secret'] });
    await signIn(wrapper, 'correct horse');
    expect(queryClient.getQueryData(['submissions', 'previous-account'])).toBeUndefined();
  });
});

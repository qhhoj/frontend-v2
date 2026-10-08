import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SecondFactorMethod } from '@/api/types/auth';
import { partialSession, profile, signedIn } from '@/test/fixtures';
import { homeRoutes } from '@/test/home-routes';
import { fail, mockApi, noContent, ok } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { socialRoutes } from '@/test/auth-routes';
import { mountApp } from '@/test/mount';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];

/** A partial session for an account with `methods` that becomes a full one once a second factor is accepted. */
function twoFactorApi(
  methods: SecondFactorMethod[] = ['totp', 'webauthn'],
  routes: Record<string, MockHandler> = {},
) {
  let verified = false;
  return mockApi({
    'GET /auth/me': () => signedIn(verified ? {} : partialSession(methods, 'user_07')),
    'POST /auth/2fa/totp/verify': () => {
      verified = true;
      return noContent();
    },
    'POST /auth/2fa/webauthn/login/verify': () => {
      verified = true;
      return noContent();
    },
    'POST /auth/logout': noContent(),
    'GET /profile': ok(profile()),
    ...homeRoutes,
    ...socialRoutes,
    ...routes,
  });
}
const pasteCode = async (wrapper: Wrapper, text: string) => {
  await wrapper
    .get('input[autocomplete="one-time-code"]')
    .trigger('paste', { clipboardData: { getData: () => text } });
  await flushPromises();
};
const boxesOf = (wrapper: Wrapper) => wrapper.findAll('[role="group"] input');
const stubPasskey = (get: () => Promise<unknown>) => {
  vi.stubGlobal('PublicKeyCredential', {
    parseRequestOptionsFromJSON: (options: object) => options,
  });
  Object.defineProperty(navigator, 'credentials', { configurable: true, value: { get } });
};
afterEach(() => void Reflect.deleteProperty(navigator, 'credentials'));
const buttonNamed = (wrapper: Wrapper, label: string) =>
  wrapper.findAll('button').find((button) => button.text() === label);
const click = async (wrapper: Wrapper, label: string) => {
  await buttonNamed(wrapper, label)!.trigger('click');
  await flushPromises();
};
const KEY_OPTIONS = { 'POST /auth/2fa/webauthn/login/options': ok({ challenge: 'Y2hhbGxlbmdl' }) };
const verifiedWithKey = (calls: ReturnType<typeof twoFactorApi>) =>
  calls.some((call) => call.path === '/auth/2fa/webauthn/login/verify');

describe('two-factor page', () => {
  it('verifies a pasted code once without a click, signs in and returns to the safe redirect', async () => {
    const calls = twoFactorApi();
    const { wrapper, router } = await mountApp('/login/2fa?redirect=/blog');
    await pasteCode(wrapper, '481 923');
    expect(
      calls.filter((call) => call.path === '/auth/2fa/totp/verify').map((call) => call.body),
    ).toEqual([{ code: '481923' }]);
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/blog'));
  });

  it('asks for the app code and names the account under the card', async () => {
    twoFactorApi();
    const { wrapper } = await mountApp('/login/2fa');
    expect(wrapper.get('h1').text()).toBe('Xác thực hai bước');
    expect(wrapper.text()).toContain('Nhập mã 6 số từ ứng dụng xác thực của bạn.');
    expect(wrapper.text()).toContain('Đang đăng nhập với user_07');
  });

  it('ignores an off-site redirect after the code is accepted', async () => {
    twoFactorApi();
    const { wrapper, router } = await mountApp(
      `/login/2fa?redirect=${encodeURIComponent('//evil.example')}`,
    );
    await pasteCode(wrapper, '481923');
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('home'));
  });

  it('empties the boxes, refocuses the first and announces a wrong code', async () => {
    twoFactorApi(['totp'], { 'POST /auth/2fa/totp/verify': fail(400, 'invalid_code') });
    const { wrapper } = await mountApp('/login/2fa');
    await pasteCode(wrapper, '000000');
    expect(wrapper.get('#main [role="alert"]').text()).toBe('Mã sai hoặc đã hết hạn.');
    expect(boxesOf(wrapper).map((box) => (box.element as HTMLInputElement).value)).toEqual([
      '',
      '',
      '',
      '',
      '',
      '',
    ]);
    expect(document.activeElement).toBe(wrapper.get('input[autocomplete="one-time-code"]').element);
    expect(wrapper.find('[data-testid="inline-bit"]').exists()).toBe(true);
  });

  it('tells a throttled viewer to wait', async () => {
    twoFactorApi(['totp'], { 'POST /auth/2fa/totp/verify': fail(429, 'rate_limited') });
    const { wrapper } = await mountApp('/login/2fa');
    await pasteCode(wrapper, '000000');
    expect(wrapper.get('#main [role="alert"]').text()).toBe(
      'Bạn thao tác quá nhanh. Hãy thử lại sau.',
    );
  });

  it('does not submit an incomplete code from the button', async () => {
    const calls = twoFactorApi();
    const { wrapper } = await mountApp('/login/2fa');
    await pasteCode(wrapper, '48');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(calls.some((call) => call.path === '/auth/2fa/totp/verify')).toBe(false);
  });

  it('accepts a backup code typed with spaces and dashes, normalised', async () => {
    const calls = twoFactorApi();
    const { wrapper } = await mountApp('/login/2fa?redirect=/blog');
    await click(wrapper, 'Dùng mã dự phòng');
    expect(wrapper.get('h1').text()).toBe('Nhập mã dự phòng');
    const input = wrapper.get('input[name="code"]');
    expect(input.attributes('autocomplete')).toBe('off');
    await input.setValue('abcd-efgh ijkl 2345');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(calls.find((call) => call.path === '/auth/2fa/totp/verify')?.body).toEqual({
      code: 'ABCDEFGHIJKL2345',
    });
  });

  it('switches back from the backup code to the app code', async () => {
    twoFactorApi();
    const { wrapper } = await mountApp('/login/2fa');
    await click(wrapper, 'Dùng mã dự phòng');
    await click(wrapper, 'Dùng mã từ ứng dụng');
    expect(boxesOf(wrapper)).toHaveLength(6);
  });

  it('hides the security-key button when the browser cannot do WebAuthn', async () => {
    twoFactorApi();
    const { wrapper } = await mountApp('/login/2fa');
    expect(buttonNamed(wrapper, 'Dùng khoá bảo mật')).toBeUndefined();
  });

  it('offers no security key to an account that has none, even in a browser that can', async () => {
    stubPasskey(() => Promise.resolve(null));
    twoFactorApi(['totp']);
    const { wrapper } = await mountApp('/login/2fa');
    expect(buttonNamed(wrapper, 'Dùng khoá bảo mật')).toBeUndefined();
    expect(boxesOf(wrapper)).toHaveLength(6);
  });

  it('signs in with a security key and returns to the redirect', async () => {
    stubPasskey(() => Promise.resolve({ toJSON: () => ({ id: 'cred-1' }) }));
    const calls = twoFactorApi(['totp', 'webauthn'], KEY_OPTIONS);
    const { wrapper, router } = await mountApp('/login/2fa?redirect=/blog');
    await click(wrapper, 'Dùng khoá bảo mật');
    expect(calls.find((call) => call.path === '/auth/2fa/webauthn/login/verify')?.body).toEqual({
      response: { id: 'cred-1' },
    });
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/blog'));
  });

  it('says it is waiting for the key while the browser prompt is open', async () => {
    stubPasskey(() => new Promise(() => {}));
    twoFactorApi(['totp', 'webauthn'], KEY_OPTIONS);
    const { wrapper } = await mountApp('/login/2fa');
    await click(wrapper, 'Dùng khoá bảo mật');
    expect(wrapper.get('h1').text()).toBe('Chạm vào khoá bảo mật');
    expect(wrapper.get('#main [role="status"]').text()).toBe('Đang chờ khoá…');
  });

  it('shows nothing and sends nothing when the viewer cancels the key prompt, and offers to try again', async () => {
    stubPasskey(() => Promise.reject(new DOMException('cancelled', 'NotAllowedError')));
    const calls = twoFactorApi(['totp', 'webauthn'], KEY_OPTIONS);
    const { wrapper } = await mountApp('/login/2fa');
    await click(wrapper, 'Dùng khoá bảo mật');
    expect(wrapper.find('#main [role="alert"]').exists()).toBe(false);
    expect(verifiedWithKey(calls)).toBe(false);
    expect(buttonNamed(wrapper, 'Thử lại')).toBeDefined();
  });

  it('explains another browser failure and keeps the backup code within reach', async () => {
    stubPasskey(() => Promise.reject(new DOMException('blocked', 'SecurityError')));
    twoFactorApi(['totp', 'webauthn'], KEY_OPTIONS);
    const { wrapper } = await mountApp('/login/2fa');
    await click(wrapper, 'Dùng khoá bảo mật');
    expect(wrapper.get('#main [role="alert"]').text()).toBe(
      'Xác minh khoá bảo mật không thành công.',
    );
    expect(buttonNamed(wrapper, 'Thử lại')).toBeDefined();
    expect(buttonNamed(wrapper, 'Dùng mã dự phòng')).toBeDefined();
  });

  it('shows a security-key-only account the key as the way in, with no code boxes and no backup code', async () => {
    stubPasskey(() => Promise.resolve({ toJSON: () => ({ id: 'cred-1' }) }));
    const calls = twoFactorApi(['webauthn'], KEY_OPTIONS);
    const { wrapper, router } = await mountApp('/login/2fa');
    expect(wrapper.get('h1').text()).toBe('Chạm vào khoá bảo mật');
    expect(boxesOf(wrapper)).toHaveLength(0);
    expect(buttonNamed(wrapper, 'Dùng mã dự phòng')).toBeUndefined();
    await click(wrapper, 'Dùng khoá bảo mật');
    expect(verifiedWithKey(calls)).toBe(true);
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('home'));
  });

  it('tells a security-key-only account in an unsupported browser why, and offers the way out', async () => {
    twoFactorApi(['webauthn']);
    const { wrapper } = await mountApp('/login/2fa');
    expect(wrapper.get('h1').text()).toBe('Không dùng được khoá');
    expect(wrapper.get('#main [role="alert"]').text()).toContain(
      'Trình duyệt này chưa hỗ trợ khoá bảo mật.',
    );
    expect(boxesOf(wrapper)).toHaveLength(0);
    expect(buttonNamed(wrapper, 'Dùng khoá bảo mật')).toBeUndefined();
    expect(buttonNamed(wrapper, 'Đăng xuất')).toBeDefined();
  });

  it('says to sign in again when no factor is left, with nothing else to try', async () => {
    const calls = twoFactorApi([]);
    const { wrapper, router } = await mountApp('/login/2fa');
    expect(wrapper.get('h1').text()).toBe('Phiên đã thay đổi');
    expect(wrapper.get('#main [role="alert"]').text()).toBe(
      'Phiên đăng nhập đã thay đổi — đăng nhập lại để tiếp tục.',
    );
    expect(wrapper.find('form').exists()).toBe(false);
    await click(wrapper, 'Đăng nhập lại');
    expect(calls.some((call) => call.path === '/auth/logout')).toBe(true);
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'));
  });

  it('signs out from the second-factor step so another account can sign in', async () => {
    const calls = twoFactorApi();
    const { wrapper, router } = await mountApp('/login/2fa');
    await click(wrapper, 'Đăng xuất');
    expect(calls.some((call) => call.path === '/auth/logout')).toBe(true);
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'));
  });

  it('keeps a partial session on this page when it tries to navigate away', async () => {
    twoFactorApi();
    const { router } = await mountApp('/login/2fa');
    await router.push('/blog');
    expect(router.currentRoute.value.name).toBe('login-2fa');
  });
});

import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { settingsRoutes } from '@/test/account-routes';
import { fail, issue, mockApi, noContent, ok, sequence } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const YUBIKEY = { id: 'key-1', name: 'YubiKey 5C (cắm máy tính)' };
const PIXEL = { id: 'key-2', name: 'Điện thoại Pixel 8' };
const pageButton = (wrapper: VueWrapper, text: string) =>
  wrapper.findAll('#main button').find((button) => button.text() === text);
const dialogButton = (text: string) =>
  [...document.body.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')].find(
    (button) => button.textContent?.trim() === text,
  )!;
function supportKeys(
  create: () => Promise<unknown> = () => Promise.resolve({ toJSON: () => ({ id: 'cred' }) }),
) {
  vi.stubGlobal('PublicKeyCredential', {
    parseCreationOptionsFromJSON: (options: object) => options,
  });
  Object.defineProperty(navigator, 'credentials', {
    value: { create: vi.fn(create) },
    configurable: true,
  });
}
afterEach(() => Reflect.deleteProperty(navigator, 'credentials'));

async function openSecurity(routes: Record<string, MockHandler>) {
  const calls = mockApi({ ...settingsRoutes(), ...routes });
  const { wrapper } = await mountApp('/settings/security');
  return { wrapper, calls };
}
async function addKey(wrapper: VueWrapper) {
  await pageButton(wrapper, 'Thêm khoá')!.trigger('click');
  await flushPromises();
  await wrapper.get('input[name="keyName"]').setValue('YubiKey 5C (cắm máy tính)');
  await wrapper.get('input[name="keyPassword"]').setValue('mật khẩu');
  await wrapper.get('form[data-step="add-key"]').trigger('submit');
  await flushPromises();
}

describe('Settings › Security › security keys', () => {
  it('lists the registered keys, each with a named remove button', async () => {
    supportKeys();
    const { wrapper } = await openSecurity({
      'GET /auth/2fa/webauthn/credentials': ok([YUBIKEY, PIXEL]),
    });
    expect(wrapper.findAll('[data-security-key] strong').map((name) => name.text())).toEqual([
      YUBIKEY.name,
      PIXEL.name,
    ]);
    expect(wrapper.find(`button[aria-label="Xoá ${PIXEL.name}"]`).exists()).toBe(true);
  });

  it('says there is no key yet, with the padlock Bit', async () => {
    supportKeys();
    const { wrapper } = await openSecurity({ 'GET /auth/2fa/webauthn/credentials': ok([]) });
    expect(wrapper.text()).toContain('Chưa có khoá nào.');
    expect(wrapper.find('[data-testid="inline-bit"][data-frame]').exists()).toBe(true); // a moving kind: the padlock, not the nightcap
  });

  it('adds a key: password, browser prompt, verify; the list and the session reload', async () => {
    supportKeys();
    const { wrapper, calls } = await openSecurity({
      'GET /auth/2fa/webauthn/credentials': sequence(ok([]), ok([YUBIKEY])),
      'POST /auth/2fa/webauthn/register/options': ok({ challenge: 'abc' }),
      'POST /auth/2fa/webauthn/register/verify': ok(YUBIKEY),
    });
    await addKey(wrapper);
    expect(wrapper.get('#main [role="status"]').text()).toBe(`Đã thêm khoá ${YUBIKEY.name}.`);
    expect(wrapper.findAll('[data-security-key] strong').map((name) => name.text())).toEqual([
      YUBIKEY.name,
    ]);
    expect(calls.filter((call) => call.path === '/auth/me')).toHaveLength(2);
  });

  it('a cancelled prompt sends no verify and shows no error', async () => {
    supportKeys(() => Promise.reject(new DOMException('cancelled', 'NotAllowedError')));
    const { wrapper, calls } = await openSecurity({
      'GET /auth/2fa/webauthn/credentials': ok([]),
      'POST /auth/2fa/webauthn/register/options': ok({ challenge: 'abc' }),
    });
    await addKey(wrapper);
    expect(calls.some((call) => call.path === '/auth/2fa/webauthn/register/verify')).toBe(false);
    expect(wrapper.find('#main [role="alert"]').exists()).toBe(false);
  });

  it('a key that is already registered shows the security-key failure', async () => {
    supportKeys();
    const { wrapper } = await openSecurity({
      'GET /auth/2fa/webauthn/credentials': ok([]),
      'POST /auth/2fa/webauthn/register/options': ok({ challenge: 'abc' }),
      'POST /auth/2fa/webauthn/register/verify': fail(400, 'webauthn_failed'),
    });
    await addKey(wrapper);
    expect(wrapper.get('#main [role="alert"]').text()).toContain(
      'Xác minh khoá bảo mật không thành công.',
    );
  });

  it('a browser without WebAuthn gets an explanation instead of the add button', async () => {
    vi.stubGlobal('PublicKeyCredential', undefined);
    const { wrapper } = await openSecurity({ 'GET /auth/2fa/webauthn/credentials': ok([]) });
    expect(pageButton(wrapper, 'Thêm khoá')).toBeUndefined();
    expect(wrapper.text()).toContain('Trình duyệt này chưa hỗ trợ khoá bảo mật.');
  });

  it('removes a key after the current password, and marks a wrong password on its field', async () => {
    supportKeys();
    const { wrapper, calls } = await openSecurity({
      'GET /auth/2fa/webauthn/credentials': sequence(ok([YUBIKEY, PIXEL]), ok([YUBIKEY])),
      'DELETE /auth/2fa/webauthn/credentials/key-2': sequence(
        fail(400, 'invalid_credentials', undefined, [
          issue('currentPassword', 'password_incorrect', 'x'),
        ]),
        noContent(),
      ),
    });
    await wrapper.get(`button[aria-label="Xoá ${PIXEL.name}"]`).trigger('click');
    await flushPromises();
    const password = document.body.querySelector<HTMLInputElement>(
      '[role="dialog"] input[name="removeKeyPassword"]',
    )!;
    password.value = 'sai';
    password.dispatchEvent(new Event('input'));
    await flushPromises();
    dialogButton('Xoá khoá').click();
    await flushPromises();
    expect(password.getAttribute('aria-invalid')).toBe('true');
    password.value = 'đúng';
    password.dispatchEvent(new Event('input'));
    await flushPromises();
    dialogButton('Xoá khoá').click();
    await flushPromises();
    expect(calls.filter((call) => call.method === 'DELETE').map((call) => call.body)).toEqual([
      { currentPassword: 'sai' },
      { currentPassword: 'đúng' },
    ]);
    expect(wrapper.findAll('[data-security-key] strong').map((name) => name.text())).toEqual([
      YUBIKEY.name,
    ]);
  });
});

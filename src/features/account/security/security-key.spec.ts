import { afterEach, describe, expect, it, vi } from 'vitest';
import { fail, mockApi, ok } from '@/test/mock-api';
import { addSecurityKey, canRegisterSecurityKey } from './security-key';

function stubBrowser(create: () => Promise<unknown>) {
  vi.stubGlobal('PublicKeyCredential', {
    parseCreationOptionsFromJSON: (options: object) => options,
  });
  Object.defineProperty(navigator, 'credentials', {
    value: { create: vi.fn(create) },
    configurable: true,
  });
}
afterEach(() => Reflect.deleteProperty(navigator, 'credentials'));

const credential = { toJSON: () => ({ id: 'cred-1' }) };

describe('addSecurityKey', () => {
  it('registers: options with the password, the browser signs, the key is verified under its name', async () => {
    stubBrowser(() => Promise.resolve(credential));
    const calls = mockApi({
      'POST /auth/2fa/webauthn/register/options': ok({ challenge: 'abc' }),
      'POST /auth/2fa/webauthn/register/verify': ok({ id: 'key-1', name: 'YubiKey 5C' }),
    });
    await expect(addSecurityKey('YubiKey 5C', 'mật khẩu')).resolves.toEqual({
      id: 'key-1',
      name: 'YubiKey 5C',
    });
    expect(calls.map((call) => call.body)).toEqual([
      { currentPassword: 'mật khẩu' },
      { name: 'YubiKey 5C', response: { id: 'cred-1' } },
    ]);
  });

  it.each(['NotAllowedError', 'AbortError'])(
    'treats a %s prompt as cancelled: no verify request',
    async (name) => {
      stubBrowser(() => Promise.reject(new DOMException('no', name)));
      const calls = mockApi({
        'POST /auth/2fa/webauthn/register/options': ok({ challenge: 'abc' }),
      });
      await expect(addSecurityKey('YubiKey', 'pw')).resolves.toBeNull();
      expect(calls).toHaveLength(1);
    },
  );

  it('rethrows any other browser failure and a refused verify', async () => {
    stubBrowser(() => Promise.reject(new DOMException('known key', 'InvalidStateError')));
    mockApi({ 'POST /auth/2fa/webauthn/register/options': ok({ challenge: 'abc' }) });
    await expect(addSecurityKey('YubiKey', 'pw')).rejects.toMatchObject({
      name: 'InvalidStateError',
    });

    stubBrowser(() => Promise.resolve(credential));
    mockApi({
      'POST /auth/2fa/webauthn/register/options': ok({ challenge: 'abc' }),
      'POST /auth/2fa/webauthn/register/verify': fail(400, 'webauthn_failed'),
    });
    await expect(addSecurityKey('YubiKey', 'pw')).rejects.toMatchObject({
      code: 'webauthn_failed',
    });
  });
});

describe('canRegisterSecurityKey', () => {
  it('needs the JSON parser and credentials.create', () => {
    vi.stubGlobal('PublicKeyCredential', {});
    expect(canRegisterSecurityKey()).toBe(false);
    stubBrowser(() => Promise.resolve(credential));
    expect(canRegisterSecurityKey()).toBe(true);
  });
});

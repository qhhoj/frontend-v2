import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockApi, noContent, ok } from '@/test/mock-api';
import { isPromptCancelled, signInWithPasskey } from './passkey';

const OPTIONS = { challenge: 'Y2hhbGxlbmdl', rpId: 'localhost' };

function stubBrowser(get: () => Promise<unknown>) {
  vi.stubGlobal('PublicKeyCredential', {
    parseRequestOptionsFromJSON: (options: object) => ({ ...options, parsed: true }),
  });
  Object.defineProperty(navigator, 'credentials', { configurable: true, value: { get } });
}
afterEach(() => void Reflect.deleteProperty(navigator, 'credentials'));

describe('signInWithPasskey', () => {
  it('asks the browser with the parsed options and sends its JSON assertion to the backend', async () => {
    const get = vi.fn(() =>
      Promise.resolve({
        toJSON: () => ({ id: 'cred-1', type: 'public-key', response: { signature: 's' } }),
      }),
    );
    stubBrowser(get);
    const calls = mockApi({
      'POST /auth/2fa/webauthn/login/options': ok(OPTIONS),
      'POST /auth/2fa/webauthn/login/verify': noContent(),
    });
    expect(await signInWithPasskey()).toBe('verified');
    expect(get).toHaveBeenCalledWith({ publicKey: { ...OPTIONS, parsed: true } });
    expect(calls[1]!.body).toEqual({
      response: { id: 'cred-1', type: 'public-key', response: { signature: 's' } },
    });
  });

  it('sends nothing when the viewer cancels or the prompt times out', async () => {
    stubBrowser(() => Promise.reject(new DOMException('cancelled', 'NotAllowedError')));
    const calls = mockApi({ 'POST /auth/2fa/webauthn/login/options': ok(OPTIONS) });
    expect(await signInWithPasskey()).toBe('cancelled');
    expect(calls).toHaveLength(1);
  });

  it('does not prompt when the session no longer needs a second factor', async () => {
    const get = vi.fn();
    stubBrowser(get);
    mockApi({ 'POST /auth/2fa/webauthn/login/options': ok(null) });
    expect(await signInWithPasskey()).toBe('not-needed');
    expect(get).not.toHaveBeenCalled();
  });

  it('lets other browser failures through for the caller to explain', async () => {
    stubBrowser(() => Promise.reject(new DOMException('blocked', 'SecurityError')));
    mockApi({ 'POST /auth/2fa/webauthn/login/options': ok(OPTIONS) });
    await expect(signInWithPasskey()).rejects.toMatchObject({ name: 'SecurityError' });
  });
});

describe('isPromptCancelled', () => {
  it.each(['NotAllowedError', 'AbortError'])('is true for a %s prompt', (name) => {
    expect(isPromptCancelled(new DOMException('closed', name))).toBe(true);
  });

  it('is false for any other failure', () => {
    expect(isPromptCancelled(new DOMException('known key', 'InvalidStateError'))).toBe(false);
    expect(isPromptCancelled(new Error('boom'))).toBe(false);
  });
});

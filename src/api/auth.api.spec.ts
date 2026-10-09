import { afterEach, describe, expect, it } from 'vitest';
import { fail, mockApi, noContent, ok } from '@/test/mock-api';
import { sessionResponse } from '@/test/fixtures';
import { onCsrfFailed, setCsrfToken } from './client';
import {
  activate,
  changePassword,
  completeSocialSignup,
  confirmPasswordReset,
  fetchSession,
  fetchSocialProviders,
  fetchUsernameAvailable,
  login,
  logout,
  logoutAllSessions,
  register,
  requestPasswordReset,
  resendActivation,
  startImpersonation,
  stopImpersonation,
  verifyTotp,
  webauthnLoginOptions,
  webauthnLoginVerify,
} from './auth.api';

afterEach(() => {
  setCsrfToken(null);
  onCsrfFailed(null);
});

describe('session calls', () => {
  it('reads the session and logs in with the credentials as the body', async () => {
    const calls = mockApi({
      'GET /auth/me': ok(sessionResponse()),
      'POST /auth/login': ok(sessionResponse()),
    });
    await fetchSession();
    await login({ username: 'u', password: 'p' });
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'GET /auth/me',
      'POST /auth/login',
    ]);
    expect(calls[1]!.body).toEqual({ username: 'u', password: 'p' });
  });

  it('ends one session or all of them without a body', async () => {
    const calls = mockApi({
      'POST /auth/logout': noContent(),
      'POST /auth/logout-all': noContent(),
    });
    await expect(logout()).resolves.toBeUndefined();
    await logoutAllSessions();
    expect(calls.map((call) => call.path)).toEqual(['/auth/logout', '/auth/logout-all']);
    expect(calls.every((call) => call.body === undefined)).toBe(true);
  });

  it('starts viewing as one user with the id as one encoded segment, and stops', async () => {
    const calls = mockApi({
      'POST /auth/impersonate/u%2F1': ok(sessionResponse()),
      'POST /auth/impersonate/stop': ok(sessionResponse()),
    });
    await startImpersonation('u/1');
    await stopImpersonation();
    expect(calls.map((call) => call.path)).toEqual([
      '/auth/impersonate/u%2F1',
      '/auth/impersonate/stop',
    ]);
  });

  it('retries a login once after csrf_failed with the refreshed token', async () => {
    let attempts = 0;
    const calls = mockApi({
      'POST /auth/login': () =>
        ++attempts === 1 ? fail(403, 'csrf_failed') : ok(sessionResponse()),
    });
    setCsrfToken('stale');
    onCsrfFailed(() => Promise.resolve(setCsrfToken('fresh')));
    await login({ username: 'u', password: 'p' });
    expect(calls.map((call) => call.headers.get('X-CSRF-Token'))).toEqual(['stale', 'fresh']);
  });
});

describe('account calls', () => {
  it('registers, activates, resends and resets with the documented bodies', async () => {
    const calls = mockApi({
      'POST /auth/register': noContent(),
      'POST /auth/activate': noContent(),
      'POST /auth/activate/resend': noContent(),
      'POST /auth/password/reset': noContent(),
      'POST /auth/password/reset/confirm': noContent(),
      'POST /auth/password/change': noContent(),
    });
    await register({ username: 'u', email: 'u@example.com', password: 'p' });
    await activate('tok');
    await resendActivation('u@example.com');
    await requestPasswordReset('u@example.com');
    await confirmPasswordReset({ token: 't', newPassword: 'n' });
    await changePassword({ currentPassword: 'c', newPassword: 'n' });
    expect(calls.map((call) => call.body)).toEqual([
      { username: 'u', email: 'u@example.com', password: 'p' },
      { token: 'tok' },
      { email: 'u@example.com' },
      { email: 'u@example.com' },
      { token: 't', newPassword: 'n' },
      { currentPassword: 'c', newPassword: 'n' },
    ]);
  });

  it('asks whether a username is free with the name in the query', async () => {
    const calls = mockApi({ 'GET /auth/username-available': ok({ available: true }) });
    await expect(fetchUsernameAvailable('new_user')).resolves.toEqual({ available: true });
    expect(calls[0]!.query.get('username')).toBe('new_user');
  });

  it('completes a social sign-up and lists the providers', async () => {
    const calls = mockApi({
      'POST /auth/social/complete': ok(sessionResponse()),
      'GET /auth/social/providers': ok({ providers: ['google'] }),
    });
    await completeSocialSignup({ token: 't', username: 'u', password: 'p' });
    await expect(fetchSocialProviders()).resolves.toEqual({ providers: ['google'] });
    expect(calls[0]!.body).toEqual({ token: 't', username: 'u', password: 'p' });
  });
});

describe('second-factor calls', () => {
  it('verifies a code and a passkey response', async () => {
    const calls = mockApi({
      'POST /auth/2fa/totp/verify': noContent(),
      'POST /auth/2fa/webauthn/login/verify': noContent(),
      'POST /auth/2fa/webauthn/login/options': ok(null),
    });
    await verifyTotp('123456');
    await webauthnLoginVerify({ id: 'cred' });
    await expect(webauthnLoginOptions()).resolves.toBeNull();
    expect(calls[0]!.body).toEqual({ code: '123456' });
    expect(calls[1]!.body).toEqual({ response: { id: 'cred' } });
  });
});

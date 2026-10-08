import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, onCsrfFailed, onUnauthorized } from '@/api/client';
import { partialSession, sessionResponse, signedIn, signedOut } from '@/test/fixtures';
import { fail, mockApi, noContent, ok } from '@/test/mock-api';
import { useSessionStore } from './session.store';

describe('useSessionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    onCsrfFailed(null);
    onUnauthorized(null);
  });

  it('is anonymous when /auth/me answers 401', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    const session = useSessionStore();
    await session.ensureLoaded();
    expect(session.status).toBe('anonymous');
    expect(session.user).toBeNull();
  });

  it('is authenticated with the user and sends its CSRF token', async () => {
    const calls = mockApi({ 'GET /auth/me': signedIn(), 'POST /auth/logout': noContent() });
    const session = useSessionStore();
    await session.ensureLoaded();
    expect(session.status).toBe('authenticated');
    expect(session.user?.username).toBe('user_01');
    await session.logout();
    expect(calls[1]!.headers.get('X-CSRF-Token')).toBe('csrf-1');
    expect(session.status).toBe('anonymous');
  });

  it('is partial while the second factor is pending', async () => {
    mockApi({ 'GET /auth/me': signedIn({ user: null, twoFactorRequired: true }) });
    const session = useSessionStore();
    await session.ensureLoaded();
    expect(session.status).toBe('partial');
  });

  it('loads the session once for concurrent callers', async () => {
    const calls = mockApi({ 'GET /auth/me': signedOut });
    const session = useSessionStore();
    await Promise.all([session.ensureLoaded(), session.ensureLoaded()]);
    await session.ensureLoaded();
    expect(calls).toHaveLength(1);
  });

  it('stays unknown after a network error so the next call retries', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('offline')));
    const session = useSessionStore();
    await expect(session.ensureLoaded()).rejects.toMatchObject({ code: 'network_error' });
    expect(session.status).toBe('unknown');
    const calls = mockApi({ 'GET /auth/me': signedOut });
    await session.ensureLoaded();
    expect(calls).toHaveLength(1);
    expect(session.status).toBe('anonymous');
  });

  it('keeps the viewer anonymous when login fails', async () => {
    mockApi({ 'GET /auth/me': signedOut, 'POST /auth/login': fail(401, 'invalid_credentials') });
    const session = useSessionStore();
    await session.ensureLoaded();
    await expect(session.login({ username: 'user_01', password: 'bad' })).rejects.toMatchObject({
      code: 'invalid_credentials',
    });
    expect(session.status).toBe('anonymous');
  });

  it('logs out locally even when the request fails', async () => {
    mockApi({ 'GET /auth/me': signedIn(), 'POST /auth/logout': fail(500, 'internal_error') });
    const session = useSessionStore();
    await session.ensureLoaded();
    await session.logout();
    expect(session.status).toBe('anonymous');
  });

  it('becomes anonymous when a request answers 401 after the session expired', async () => {
    mockApi({
      'GET /auth/me': signedIn(),
      'POST /submissions/abc/abort': fail(401, 'unauthorized'),
    });
    const session = useSessionStore();
    await session.ensureLoaded();
    await expect(apiRequest('/submissions/abc/abort', { method: 'POST' })).rejects.toMatchObject({
      code: 'unauthorized',
    });
    expect(session.status).toBe('anonymous');
    expect(session.user).toBeNull();
  });

  it('refreshes the session and retries a request after csrf_failed', async () => {
    let meCalls = 0;
    let abortCalls = 0;
    const calls = mockApi({
      'GET /auth/me': () => ok(sessionResponse({ csrfToken: `csrf-${++meCalls}` })),
      'POST /submissions/abc/abort': () => (++abortCalls === 1 ? fail(403, 'csrf_failed') : ok({})),
    });
    await useSessionStore().ensureLoaded();
    await apiRequest('/submissions/abc/abort', { method: 'POST' });
    expect(
      calls
        .filter((call) => call.method === 'POST')
        .map((call) => call.headers.get('X-CSRF-Token')),
    ).toEqual(['csrf-1', 'csrf-2']);
  });

  it('keeps the factors a partial session may use, and forgets them once the session is whole', async () => {
    let verified = false;
    mockApi({
      'GET /auth/me': () =>
        verified ? signedIn() : signedIn(partialSession(['webauthn'], 'user_07')),
    });
    const session = useSessionStore();
    await session.ensureLoaded();
    expect(session.status).toBe('partial');
    expect(session.twoFactor).toEqual({ username: 'user_07', methods: ['webauthn'] });
    verified = true;
    await session.refresh();
    expect(session.status).toBe('authenticated');
    expect(session.twoFactor).toBeNull();
  });

  it('adopts the session of a completed social signup', async () => {
    const calls = mockApi({
      'POST /auth/social/complete': ok(sessionResponse({ csrfToken: 'csrf-social' })),
      'POST /auth/logout': noContent(),
    });
    const session = useSessionStore();
    await session.completeSocialSignup({
      token: 'pending-1',
      username: 'new_user',
      password: 'long enough password',
    });
    expect(calls[0]!.body).toEqual({
      token: 'pending-1',
      username: 'new_user',
      password: 'long enough password',
    });
    expect(session.status).toBe('authenticated');
    await session.logout();
    expect(calls[1]!.headers.get('X-CSRF-Token')).toBe('csrf-social');
  });

  it('signs out every session: the server is told, then this viewer is anonymous', async () => {
    const calls = mockApi({ 'GET /auth/me': signedIn(), 'POST /auth/logout-all': noContent() });
    const session = useSessionStore();
    await session.ensureLoaded();
    await session.logoutEverywhere();
    const logoutAll = calls.find((call) => call.path === '/auth/logout-all')!;
    expect(logoutAll.method).toBe('POST');
    expect(logoutAll.body).toBeUndefined();
    expect(session.status).toBe('anonymous');
  });

  it('stays signed in when signing out everywhere fails, and rethrows', async () => {
    mockApi({ 'GET /auth/me': signedIn(), 'POST /auth/logout-all': fail(500, 'http_error') });
    const session = useSessionStore();
    await session.ensureLoaded();
    await expect(session.logoutEverywhere()).rejects.toMatchObject({ status: 500 });
    expect(session.status).toBe('authenticated');
  });

  it('stopping an impersonation takes over the staff session the server returns', async () => {
    const staff = sessionResponse({
      user: { ...sessionResponse().user!, id: 'staff-1', username: 'admin', isStaff: true },
    });
    const calls = mockApi({
      'GET /auth/me': signedIn({ impersonatorId: 'staff-1' }),
      'POST /auth/impersonate/stop': ok(staff),
    });
    const session = useSessionStore();
    await session.ensureLoaded();
    expect(session.impersonatorId).toBe('staff-1');
    await session.stopImpersonating();
    expect(calls.at(-1)).toMatchObject({ method: 'POST', path: '/auth/impersonate/stop' });
    expect(session.impersonatorId).toBeNull();
    expect(session.user?.username).toBe('admin');
  });
});

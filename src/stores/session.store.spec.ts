import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, onCsrfFailed, onUnauthorized } from '@/api/client';
import { partialSession, sessionResponse, sessionUser, signedIn, signedOut } from '@/test/fixtures';
import { fail, mockApi, noContent, ok } from '@/test/mock-api';
import { useSessionStore } from './session.store';

describe('useSessionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    onCsrfFailed(null);
    onUnauthorized(null);
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

  it('logs out locally even when the request fails', async () => {
    mockApi({ 'GET /auth/me': signedIn(), 'POST /auth/logout': fail(500, 'internal_error') });
    const session = useSessionStore();
    await session.ensureLoaded();
    await session.logout();
    expect(session.status).toBe('anonymous');
  });

  it('signs out at once, without waiting for the server to answer', async () => {
    const calls = mockApi({ 'GET /auth/me': signedIn(), 'POST /auth/logout': noContent() });
    const session = useSessionStore();
    await session.ensureLoaded();
    let answered = false;
    const realFetch = globalThis.fetch;
    vi.stubGlobal('fetch', async (...args: Parameters<typeof fetch>) => {
      const response = await realFetch(...args);
      await new Promise((resolve) => setTimeout(resolve, 50));
      answered = true;
      return response;
    });
    await session.logout();
    expect(session.status).toBe('anonymous');
    expect(answered).toBe(false);
    expect(calls.at(-1)!.path).toBe('/auth/logout');
  });

  it('holds a login back until the sign-out request has finished', async () => {
    const order: string[] = [];
    mockApi({
      'GET /auth/me': signedIn(),
      'POST /auth/logout': () => {
        order.push('logout');
        return noContent();
      },
      'POST /auth/login': () => {
        order.push('login');
        return signedIn();
      },
    });
    const session = useSessionStore();
    await session.ensureLoaded();
    await session.logout();
    await session.login({ username: 'user_01', password: 'secret-password' });
    expect(order).toEqual(['logout', 'login']);
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

  it('does not resend a write after csrf_failed when another tab signed in as someone else', async () => {
    const other = sessionUser({ id: '0192a000-0000-7000-8000-000000000002', username: 'user_02' });
    let meCalls = 0;
    const calls = mockApi({
      'GET /auth/me': () =>
        ++meCalls === 1 ? signedIn() : signedIn({ user: other, csrfToken: 'csrf-2' }),
      'PATCH /profile': () => fail(403, 'csrf_failed'),
    });
    const session = useSessionStore();
    await session.ensureLoaded();
    await expect(
      apiRequest('/profile', { method: 'PATCH', body: { about: 'draft' } }),
    ).rejects.toMatchObject({ code: 'csrf_failed' });
    expect(calls.filter((call) => call.method === 'PATCH')).toHaveLength(1);
    expect(session.user?.username).toBe('user_02');
  });

  it('signs out with a stale token: resends the sign-out with a fresh token, never shows the other session, and lets a login through', async () => {
    let meCalls = 0;
    const shown: (string | null)[] = [];
    let shownBeforeLogin: (string | null)[] = [];
    const calls = mockApi({
      'GET /auth/me': () => ok(sessionResponse({ csrfToken: `csrf-${++meCalls}` })),
      'POST /auth/logout': (call) =>
        call.headers.get('X-CSRF-Token') === 'csrf-2' ? noContent() : fail(403, 'csrf_failed'),
      'POST /auth/login': () => {
        shownBeforeLogin = [...shown];
        return signedIn({ csrfToken: 'csrf-login' });
      },
    });
    const session = useSessionStore();
    await session.ensureLoaded();
    session.$subscribe(() => shown.push(session.user?.username ?? null), { flush: 'sync' });
    await session.logout();
    await session.login({ username: 'user_01', password: 'secret-password' });
    const logouts = calls.filter((call) => call.path === '/auth/logout');
    expect(logouts.map((call) => call.headers.get('X-CSRF-Token'))).toEqual(['csrf-1', 'csrf-2']);
    expect(shownBeforeLogin.length).toBeGreaterThan(0);
    expect(shownBeforeLogin.every((username) => username === null)).toBe(true);
    expect(session.status).toBe('authenticated');
  }, 2000);

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

  it('re-reads the session when another tab signs in as someone else', async () => {
    const other = sessionUser({ id: '0192a000-0000-7000-8000-0000000000f2', username: 'user_02' });
    mockApi({ 'GET /auth/me': signedOut });
    const session = useSessionStore();
    await session.ensureLoaded();
    mockApi({ 'GET /auth/me': signedIn({ user: other }) });
    const otherTab = new BroadcastChannel('qhhoj-session');
    otherTab.postMessage({ userId: other.id });
    otherTab.close();
    await vi.waitFor(() => expect(session.user?.id).toBe(other.id));
    expect(session.status).toBe('authenticated');
  });
});

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, onCsrfFailed, onUnauthorized } from '@/api/client';
import { sessionResponse, signedIn, signedOut } from '@/test/fixtures';
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
});

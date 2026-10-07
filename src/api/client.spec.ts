import { afterEach, describe, expect, it, vi } from 'vitest';
import { fail, mockApi, noContent, ok, page } from '@/test/mock-api';
import {
  ApiError,
  apiPage,
  apiRequest,
  buildUrl,
  onCsrfFailed,
  onUnauthorized,
  setCsrfToken,
} from './client';

describe('api client', () => {
  afterEach(() => {
    setCsrfToken(null);
    onCsrfFailed(null);
    onUnauthorized(null);
  });

  it('unwraps a single value and sends same-origin JSON requests', async () => {
    mockApi({ 'GET /problems/meta': ok({ types: [] }) });
    await expect(apiRequest('/problems/meta')).resolves.toEqual({ types: [] });
    const [, init] = (fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock
      .calls[0]!;
    expect(init.credentials).toBe('same-origin');
  });

  it('returns items and meta for a list', async () => {
    mockApi({ 'GET /problems': page([{ code: 'aplusb' }], { total: 120 }) });
    await expect(apiPage('/problems')).resolves.toEqual({
      items: [{ code: 'aplusb' }],
      meta: { page: 1, pageSize: 50, total: 120 },
    });
  });

  it('resolves undefined for 204', async () => {
    mockApi({ 'POST /auth/logout': noContent() });
    await expect(apiRequest('/auth/logout', { method: 'POST' })).resolves.toBeUndefined();
  });

  it('repeats array parameters and drops empty values', () => {
    expect(
      buildUrl('/problems', {
        typeIds: ['a', 'b'],
        search: '',
        pointsMin: null,
        sort: undefined,
        page: 2,
        virtual: true,
      }),
    ).toBe('/api/internal/problems?typeIds=a&typeIds=b&page=2&virtual=true');
  });

  it('sends the CSRF token on unsafe methods only', async () => {
    const calls = mockApi({ 'GET /profile': ok({}), 'PATCH /profile': ok({}) });
    setCsrfToken('token-1');
    await apiRequest('/profile');
    await apiRequest('/profile', { method: 'PATCH', body: { siteTheme: 'dark' } });
    expect(calls[0]!.headers.get('X-CSRF-Token')).toBeNull();
    expect(calls[1]!.headers.get('X-CSRF-Token')).toBe('token-1');
    expect(calls[1]!.body).toEqual({ siteTheme: 'dark' });
  });

  it('turns the error envelope into an ApiError with field messages', async () => {
    mockApi({ 'POST /auth/register': fail(400, 'validation_failed', { username: ['taken'] }) });
    const error = await apiRequest('/auth/register', { method: 'POST', body: {} }).catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: 'validation_failed',
      status: 400,
      fields: { username: ['taken'] },
    });
  });

  it('reports a network failure as network_error', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));
    await expect(apiRequest('/problems')).rejects.toMatchObject({
      code: 'network_error',
      status: 0,
    });
  });

  it('reports an unreadable success body as invalid_response', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('<html>', { status: 200 })));
    await expect(apiRequest('/problems')).rejects.toMatchObject({
      code: 'invalid_response',
      status: 200,
    });
  });

  it('retries once after csrf_failed with the refreshed token', async () => {
    let attempts = 0;
    const calls = mockApi({
      'POST /submissions/abc/abort': () =>
        ++attempts === 1 ? fail(403, 'csrf_failed') : ok({ aborted: true }),
    });
    setCsrfToken('stale');
    onCsrfFailed(() => Promise.resolve(setCsrfToken('fresh')));
    await expect(apiRequest('/submissions/abc/abort', { method: 'POST' })).resolves.toEqual({
      aborted: true,
    });
    expect(calls.map((call) => call.headers.get('X-CSRF-Token'))).toEqual(['stale', 'fresh']);
  });

  it('does not retry a second csrf_failed', async () => {
    let refreshes = 0;
    const calls = mockApi({ 'POST /submissions/abc/abort': fail(403, 'csrf_failed') });
    onCsrfFailed(() => Promise.resolve(void refreshes++));
    await expect(apiRequest('/submissions/abc/abort', { method: 'POST' })).rejects.toMatchObject({
      code: 'csrf_failed',
    });
    expect(calls).toHaveLength(2);
    expect(refreshes).toBe(1);
  });

  it('reports an expired session on a protected request but not on the session probe', async () => {
    mockApi({
      'POST /submissions/abc/abort': fail(401, 'unauthorized'),
      'GET /auth/me': fail(401, 'unauthorized'),
    });
    const handler = vi.fn();
    onUnauthorized(handler);
    await expect(apiRequest('/auth/me')).rejects.toMatchObject({ code: 'unauthorized' });
    expect(handler).not.toHaveBeenCalled();
    await expect(apiRequest('/submissions/abc/abort', { method: 'POST' })).rejects.toMatchObject({
      code: 'unauthorized',
    });
    expect(handler).toHaveBeenCalledOnce();
  });
});

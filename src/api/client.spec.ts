import { afterEach, describe, expect, it, vi } from 'vitest';
import { fail, mockApi, noContent, ok, page, rateLimited } from '@/test/mock-api';
import {
  ApiError,
  apiPage,
  apiRequest,
  buildUrl,
  onCsrfFailed,
  onGateRequired,
  onUnauthorized,
  setCsrfToken,
} from './client';

describe('api client', () => {
  afterEach(() => {
    setCsrfToken(null);
    onCsrfFailed(null);
    onUnauthorized(null);
    onGateRequired(null);
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

  it('passes an aborted request through instead of reporting a network error', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new DOMException('aborted', 'AbortError')));
    const error = await apiRequest('/problems').catch((caught: unknown) => caught);
    expect(error).not.toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ name: 'AbortError' });
  });

  it('keeps the HTTP status of a non-JSON error body', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        new Response('<html>Bad Gateway</html>', { status: 502, statusText: 'Bad Gateway' }),
      ),
    );
    await expect(apiRequest('/problems')).rejects.toMatchObject({
      code: 'http_error',
      status: 502,
    });
  });

  it('refreshes once for parallel csrf_failed answers', async () => {
    const attempts = new Map<string, number>();
    mockApi({
      'POST /a': () =>
        (attempts.set('a', (attempts.get('a') ?? 0) + 1), attempts.get('a')) === 1
          ? fail(403, 'csrf_failed')
          : ok('a'),
      'POST /b': () =>
        (attempts.set('b', (attempts.get('b') ?? 0) + 1), attempts.get('b')) === 1
          ? fail(403, 'csrf_failed')
          : ok('b'),
    });
    const refresh = vi.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 5)));
    onCsrfFailed(refresh);
    await expect(
      Promise.all([apiRequest('/a', { method: 'POST' }), apiRequest('/b', { method: 'POST' })]),
    ).resolves.toEqual(['a', 'b']);
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('survives a failing refresh: the retry reports its own error and unauthorized is handled', async () => {
    let attempts = 0;
    mockApi({
      'POST /a': () => (++attempts === 1 ? fail(403, 'csrf_failed') : fail(401, 'unauthorized')),
    });
    const handler = vi.fn();
    onUnauthorized(handler);
    onCsrfFailed(() => Promise.reject(new Error('offline')));
    await expect(apiRequest('/a', { method: 'POST' })).rejects.toMatchObject({
      code: 'unauthorized',
    });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('rejects a list answer without page metadata', async () => {
    mockApi({ 'GET /problems/meta': ok({ types: [] }) });
    await expect(apiPage('/problems/meta')).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('keeps the field issues and the extra members of an error answer', async () => {
    mockApi({
      'POST /x': fail(
        403,
        'banned',
        undefined,
        [{ field: 'username', code: 'username_taken', message: 'Username is taken.' }],
        { banReason: 'cheating in R41' },
      ),
    });
    const error = await apiRequest('/x', { method: 'POST' }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: 'banned',
      issues: [{ field: 'username', code: 'username_taken', message: 'Username is taken.' }],
      extra: { banReason: 'cheating in R41' },
    });
  });

  it('has no issues and no extra members when the answer carries none', async () => {
    mockApi({ 'POST /x': fail(429, 'rate_limited') });
    const error = await apiRequest('/x', { method: 'POST' }).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ code: 'rate_limited', fields: {}, issues: [], extra: {} });
  });

  it('treats issues and fields arriving as null as absent', async () => {
    mockApi({
      'POST /x': {
        status: 400,
        body: { error: { code: 'validation_failed', message: 'x', issues: null, fields: null } },
      },
    });
    const error = await apiRequest('/x', { method: 'POST' }).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ code: 'validation_failed', fields: {}, issues: [], extra: {} });
  });

  it.each(['two_factor_required', 'password_change_required'])(
    'tells the gate hook about %s and still throws it',
    async (code) => {
      mockApi({ 'POST /x': fail(403, code) });
      const hook = vi.fn();
      onGateRequired(hook);
      await expect(apiRequest('/x', { method: 'POST' })).rejects.toMatchObject({ code });
      expect(hook).toHaveBeenCalledTimes(1);
    },
  );

  it('does not call the gate hook for other refusals', async () => {
    mockApi({ 'POST /x': fail(403, 'forbidden') });
    const hook = vi.fn();
    onGateRequired(hook);
    await apiRequest('/x', { method: 'POST' }).catch(() => undefined);
    expect(hook).not.toHaveBeenCalled();
  });
});

it('passes a FormData body through without a JSON content type', async () => {
  const calls = mockApi({ 'POST /x': ok({}) });
  const form = new FormData();
  form.append('file', new File(['x'], 'a.sb3'));
  await apiRequest('/x', { method: 'POST', body: form });
  expect(calls[0]!.body).toBe(form);
  expect(calls[0]!.headers.get('Content-Type')).toBeNull();
});
it('still sends a plain object as JSON', async () => {
  const calls = mockApi({ 'POST /x': ok({}) });
  await apiRequest('/x', { method: 'POST', body: { a: 1 } });
  expect(calls[0]!.body).toEqual({ a: 1 });
  expect(calls[0]!.headers.get('Content-Type')).toBe('application/json');
});

it('keeps Retry-After of a refusal in whole seconds, and null when the server sent none', async () => {
  mockApi({ 'POST /x': rateLimited(2520), 'POST /y': fail(429, 'rate_limited') });
  await expect(apiRequest('/x', { method: 'POST' })).rejects.toMatchObject({
    code: 'rate_limited',
    retryAfterSeconds: 2520,
  });
  await expect(apiRequest('/y', { method: 'POST' })).rejects.toMatchObject({
    retryAfterSeconds: null,
  });
});

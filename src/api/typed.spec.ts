import { afterEach, describe, expect, expectTypeOf, it } from 'vitest';
import { fail, mockApi, noContent, ok, page, rateLimited } from '@/test/mock-api';
import { onCsrfFailed, setCsrfToken } from './client';
import type { Page } from './client';
import type { Schemas } from './schemas';
import { apiGet, apiGetPage, apiSend, apiUrl, fillPath } from './typed';
import type { CallOptions, DataOf, ItemOf } from './typed';

afterEach(() => {
  setCsrfToken(null);
  onCsrfFailed(null);
});

describe('fillPath', () => {
  it('encodes each parameter as one path segment', () => {
    expect(fillPath('/problems/{code}/data/files/{name}', { code: 'a/b', name: '50%.in' })).toBe(
      '/problems/a%2Fb/data/files/50%25.in',
    );
    expect(fillPath('/problems/{code}', { code: 'Đề 1' })).toBe('/problems/%C4%90%E1%BB%81%201');
  });
  it('accepts a number and refuses a missing parameter', () => {
    expect(fillPath('/users/{id}', { id: 7 })).toBe('/users/7');
    expect(() => fillPath('/users/{id}')).toThrow('Missing path parameter id');
  });
});

describe('apiGet', () => {
  it('requests the filled route with its query and resolves the unwrapped data', async () => {
    const calls = mockApi({ 'GET /problems/a%2Fb': ok({ code: 'a/b' }) });
    await expect(
      apiGet('/problems/{code}', { path: { code: 'a/b' }, query: { lang: 'en' } }),
    ).resolves.toEqual({ code: 'a/b' });
    expect(calls[0]!.path).toBe('/problems/a%2Fb');
    expect(calls[0]!.query.get('lang')).toBe('en');
  });
  it('surfaces a 429 with its Retry-After seconds, as the plain client does', async () => {
    mockApi({ 'GET /auth/me': rateLimited(7) });
    await expect(apiGet('/auth/me')).rejects.toMatchObject({
      code: 'rate_limited',
      retryAfterSeconds: 7,
    });
  });
});

describe('apiGetPage', () => {
  it('resolves items and meta of a paginated route', async () => {
    const calls = mockApi({ 'GET /problems': page([{ code: 'aplusb' }], { total: 1 }) });
    const result = await apiGetPage('/problems', {
      query: { page: 2, search: 'sum', visibility: 'public' },
    });
    expect(result).toEqual({
      items: [{ code: 'aplusb' }],
      meta: { page: 1, pageSize: 50, total: 1 },
    });
    expect(calls[0]!.query.get('page')).toBe('2');
    expect(calls[0]!.query.get('search')).toBe('sum');
  });
});

describe('apiSend', () => {
  it('sends the JSON body with the CSRF token', async () => {
    setCsrfToken('token-1');
    const calls = mockApi({ 'POST /auth/login': ok({ user: null }) });
    await apiSend('post', '/auth/login', { body: { username: 'u', password: 'p' } });
    expect(calls[0]!.body).toEqual({ username: 'u', password: 'p' });
    expect(calls[0]!.headers.get('X-CSRF-Token')).toBe('token-1');
    expect(calls[0]!.headers.get('Content-Type')).toBe('application/json');
  });
  it('refreshes the token once and retries once on csrf_failed', async () => {
    let attempts = 0;
    const calls = mockApi({
      'POST /submissions/abc/abort': () =>
        ++attempts === 1 ? fail(403, 'csrf_failed') : noContent(),
    });
    setCsrfToken('stale');
    onCsrfFailed(() => Promise.resolve(setCsrfToken('fresh')));
    await expect(
      apiSend('post', '/submissions/{id}/abort', { path: { id: 'abc' } }),
    ).resolves.toBeUndefined();
    expect(calls.map((call) => call.headers.get('X-CSRF-Token'))).toEqual(['stale', 'fresh']);
  });
  it('sends a FormData body untouched, without a JSON content type', async () => {
    const calls = mockApi({ 'POST /problems/p1/submit/file': ok({ id: 's1' }) });
    const form = new FormData();
    form.append('language', 'lang-1');
    form.append('file', new File(['x'], 'a.cpp'));
    await apiSend('post', '/problems/{code}/submit/file', { path: { code: 'p1' }, body: form });
    expect(calls[0]!.body).toBeInstanceOf(FormData);
    expect(calls[0]!.headers.get('Content-Type')).toBeNull();
  });
});

describe('apiUrl', () => {
  it('builds the link of a route without making a request', () => {
    const calls = mockApi({});
    expect(apiUrl('/problems/{code}/pdf', { path: { code: 'a/b' }, query: { lang: 'en' } })).toBe(
      '/api/internal/problems/a%2Fb/pdf?lang=en',
    );
    expect(calls).toHaveLength(0);
  });
});

describe('type tests (compiled by vue-tsc; the rejected calls are in typed.type-test.ts)', () => {
  it('derive data, items and bodies from the document', () => {
    expectTypeOf<DataOf<'/auth/me', 'get'>>().toEqualTypeOf<Schemas['SessionResponse']>();
    expectTypeOf<ItemOf<'/problems'>>().toEqualTypeOf<Schemas['ProblemListItemResponse']>();
    expectTypeOf<DataOf<'/auth/logout', 'post'>>().toBeVoid();
    expectTypeOf<
      CallOptions<'/problems/{code}/submit/file', 'post'>['body']
    >().toEqualTypeOf<FormData>();
    expectTypeOf<Page<ItemOf<'/problems'>>['items']>().toEqualTypeOf<
      Schemas['ProblemListItemResponse'][]
    >();
  });
  it('keep null data null and never type an error response as the success body', () => {
    expectTypeOf<DataOf<'/auth/2fa/webauthn/login/options', 'post'>>().toEqualTypeOf<{
      [key: string]: unknown;
    } | null>();
  });
});

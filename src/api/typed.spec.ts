import { afterEach, describe, expect, it } from 'vitest';
import { mockApi, ok } from '@/test/mock-api';
import { onCsrfFailed, setCsrfToken } from './client';
import { apiGet, fillPath } from './typed';

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
});

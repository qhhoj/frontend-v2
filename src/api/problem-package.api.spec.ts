import { describe, expect, it } from 'vitest';
import { ApiError } from './client';
import { fail, mockApi } from '@/test/mock-api';
import { packageStatus } from '@/test/f4-fixtures';
import { packageDownloadUrl, probePackage, requestPackage } from './problem-package.api';

describe('problem package api', () => {
  it('POSTs once and returns the status the server chose (200 ready or 202 building)', async () => {
    const calls = mockApi({
      'POST /problems/cuvui/package': { status: 202, body: { data: packageStatus('building') } },
    });
    expect((await requestPackage('cuvui')).status).toBe('building');
    expect(calls[0]!.method).toBe('POST');
  });

  it('links the download through the api base with the code escaped', () => {
    expect(packageDownloadUrl('a b')).toBe('/api/internal/problems/a%20b/package');
  });

  it('probes GET: a zip is ready, a 202 is building at the Retry-After pace', async () => {
    mockApi({
      'GET /problems/cuvui/package': {
        status: 200,
        headers: { 'Content-Type': 'application/zip' },
      },
      'GET /problems/dangxay/package': {
        status: 202,
        headers: { 'Retry-After': '7' },
        body: { data: { status: 'building' } },
      },
    });
    expect(await probePackage('cuvui')).toEqual({ state: 'ready' });
    expect(await probePackage('dangxay')).toEqual({ state: 'building', retryAfterMs: 7000 });
  });

  it.each([
    [409, 'package_too_large'],
    [503, 'package_unavailable'],
    [404, 'package_not_built'],
    [429, 'rate_limited'],
  ])('maps a %i %s to a failure with that reason', async (status, code) => {
    mockApi({ 'GET /problems/cuvui/package': fail(status, code) });
    const probe = await probePackage('cuvui');
    expect(probe).toMatchObject({ state: 'failed', reason: code });
  });

  it('refuses a 200 that is not a zip (an SPA fallback page)', async () => {
    mockApi({ 'GET /problems/cuvui/package': { status: 200, body: { data: 'html' } } });
    await expect(probePackage('cuvui')).rejects.toBeInstanceOf(ApiError);
  });

  it('turns an unknown refusal into a generic failure', async () => {
    mockApi({ 'GET /problems/cuvui/package': fail(500, 'boom') });
    expect(await probePackage('cuvui')).toMatchObject({ state: 'failed', reason: 'generic' });
  });
});

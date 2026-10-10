import { describe, expect, it } from 'vitest';
import { mockApi, ok } from '@/test/mock-api';
import { deleteConfig, fetchSiteForAdmin, putConfig } from './site-admin.api';

describe('site admin calls', () => {
  it('reads the site revalidated, and writes and deletes a config key', async () => {
    const calls = mockApi({
      'GET /site': ok({ config: {} }),
      'PUT /admin/site/config/a%2Fb': ok({}),
      'DELETE /admin/site/config/a%2Fb': { status: 204 },
    });
    await fetchSiteForAdmin();
    await putConfig('a/b', 'v');
    await deleteConfig('a/b');
    expect(calls.map((call) => call.method)).toEqual(['GET', 'PUT', 'DELETE']);
    expect(calls[1]!.body).toEqual({ value: 'v' });
  });
});

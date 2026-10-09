import { describe, expect, it } from 'vitest';
import { mockApi, ok } from '@/test/mock-api';
import {
  createNavItem,
  deleteConfig,
  deleteNavItem,
  fetchSiteForAdmin,
  putConfig,
  updateNavItem,
} from './site-admin.api';

describe('site admin calls', () => {
  it('reads the site revalidated, and writes and deletes a config key', async () => {
    const calls = mockApi({
      'GET /site': ok({ navigation: [], config: {} }),
      'PUT /admin/site/config/a%2Fb': ok({}),
      'DELETE /admin/site/config/a%2Fb': { status: 204 },
    });
    await fetchSiteForAdmin();
    await putConfig('a/b', 'v');
    await deleteConfig('a/b');
    expect(calls.map((call) => call.method)).toEqual(['GET', 'PUT', 'DELETE']);
    expect(calls[1]!.body).toEqual({ value: 'v' });
  });

  it('creates, patches and deletes a navigation item by its encoded id', async () => {
    const calls = mockApi({
      'POST /admin/site/navigation': ok({}),
      'PATCH /admin/site/navigation/n%2F1': ok({}),
      'DELETE /admin/site/navigation/n%2F1': { status: 204 },
    });
    await createNavItem({ key: 'k', label: 'L', path: '/p', order: 1 });
    await updateNavItem('n/1', { hidden: true });
    await deleteNavItem('n/1');
    expect(calls[0]!.body).toEqual({ key: 'k', label: 'L', path: '/p', order: 1 });
    expect(calls[1]!.body).toEqual({ hidden: true });
    expect(calls[2]!.path).toBe('/admin/site/navigation/n%2F1');
  });
});

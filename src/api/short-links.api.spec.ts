import { describe, expect, it } from 'vitest';
import { shortLink } from '@/test/f5-fixtures';
import { mockApi, noContent, ok, page } from '@/test/mock-api';
import { createShortLink, deleteShortLink, fetchShortLinks } from './short-links.api';

describe('short-links api', () => {
  it('creates a link by POST with the path only', async () => {
    const calls = mockApi({ 'POST /short-links': { status: 201, ...ok(shortLink()) } });
    const link = await createShortLink({ path: '/problems/aplusb' });
    expect(calls[0]).toMatchObject({
      method: 'POST',
      path: '/short-links',
      body: { path: '/problems/aplusb' },
    });
    expect(link.code).toBe('k7m2xq');
  });

  it('lists every link with scope=all and the page', async () => {
    const calls = mockApi({ 'GET /short-links': page([shortLink()]) });
    const result = await fetchShortLinks({ scope: 'all', page: 2, pageSize: 50 });
    expect(calls[0]!.query.get('scope')).toBe('all');
    expect(calls[0]!.query.get('page')).toBe('2');
    expect(result.items).toHaveLength(1);
  });

  it('deletes by code', async () => {
    const calls = mockApi({ 'DELETE /short-links/hsg-2026': noContent() });
    await expect(deleteShortLink('hsg-2026')).resolves.toBeUndefined();
    expect(calls[0]).toMatchObject({ method: 'DELETE', path: '/short-links/hsg-2026' });
  });
});

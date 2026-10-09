import { describe, expect, it } from 'vitest';
import { mockApi, ok } from '@/test/mock-api';
import { fetchText, lookupOrganization, lookupUser, renderPreview } from './admin-common.api';

describe('admin common calls', () => {
  it('keeps only the id and name of a looked-up user and organization', async () => {
    const calls = mockApi({
      'GET /users/a%2Fb': ok({ id: 'u1', username: 'a/b', points: 3 }),
      'GET /organizations/lhp': ok({ id: 'o1', slug: 'lhp', name: 'LHP' }),
    });
    expect(await lookupUser('a/b')).toEqual({ id: 'u1', username: 'a/b' });
    expect(await lookupOrganization('lhp')).toEqual({ id: 'o1', slug: 'lhp' });
    expect(calls.map((call) => call.path)).toEqual(['/users/a%2Fb', '/organizations/lhp']);
  });

  it('renders a problem style through the problem route and a static page through its own', async () => {
    const calls = mockApi({
      'POST /problems/render-preview': ok({ html: '<p>a</p>' }),
      'POST /admin/site/pages/render-preview': ok({ html: '<p>b</p>' }),
    });
    expect(await renderPreview('blog', '# a')).toBe('<p>a</p>');
    expect(await renderPreview('flatpage', '# b')).toBe('<p>b</p>');
    expect(calls[0]!.body).toEqual({ style: 'blog', markdown: '# a' });
    expect(calls[1]!.path).toBe('/admin/site/pages/render-preview');
    expect(calls[1]!.body).toEqual({ content: '# b' });
  });

  it('reads a raw text body', async () => {
    const calls = mockApi({ 'GET /x/init.yml': { body: undefined } });
    await fetchText('/x/init.yml');
    expect(calls[0]!.path).toBe('/x/init.yml');
  });
});

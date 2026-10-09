import { describe, expect, it } from 'vitest';
import { displayUrl, shortLinkPath, shortLinkUrl } from './short-link-path';

describe('shortLinkPath', () => {
  it.each([
    [{ kind: 'problem', code: 'aplusb' }, '/problems/aplusb'],
    [{ kind: 'contest', key: 'hsg26' }, '/contests/hsg26'],
    [
      { kind: 'post', id: '0190a000-0000-7000-8000-000000000001' },
      '/blog/0190a000-0000-7000-8000-000000000001',
    ],
    [{ kind: 'user', username: 'a.b-c@d+e' }, '/users/a.b-c@d+e'],
    [{ kind: 'organization', slug: 'lhp' }, '/organizations/lhp'],
  ] as const)('builds the raw canonical path of %j', (target, expected) => {
    expect(shortLinkPath(target)).toBe(expected);
  });
});

describe('shortLinkUrl and displayUrl', () => {
  it('points at /s/<code> on this origin and shows it without the scheme', () => {
    const url = shortLinkUrl('k7m2xq', 'https://qhhoj.vn');
    expect(url).toBe('https://qhhoj.vn/s/k7m2xq');
    expect(displayUrl(url)).toBe('qhhoj.vn/s/k7m2xq');
  });
});

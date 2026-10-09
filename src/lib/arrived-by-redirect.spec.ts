import { describe, expect, it } from 'vitest';
import { arrivedByRedirect } from './arrived-by-redirect';

const entry = (redirectCount: number, name = 'https://qhhoj.vn/problems/secret') => ({
  redirectCount,
  name,
});

describe('arrivedByRedirect', () => {
  it.each([
    ['a redirected load still on its path', entry(1), '/problems/secret', true],
    ['a load without a redirect', entry(0), '/problems/secret', false],
    ['an in-app move to another page after the redirect', entry(1), '/contests/r42', false],
    [
      'an encoded and a raw spelling of the same path',
      entry(1, 'https://qhhoj.vn/users/a%40b'),
      '/users/a@b',
      true,
    ],
    ['no navigation timing at all', undefined, '/problems/secret', false],
    ['a malformed entry name', entry(1, 'not a url'), '/problems/secret', false],
  ])('%s -> %s', (_name, navigation, path, expected) => {
    expect(arrivedByRedirect(navigation, path)).toBe(expected);
  });
});

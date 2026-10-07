import { describe, expect, it } from 'vitest';
import { safeRedirect } from './safe-redirect';

describe('safeRedirect', () => {
  it.each(['/problems', '/settings?tab=theme', '/problems/a-plus-b#statement', '/'])(
    'keeps the in-app path %s',
    (path) => {
      expect(safeRedirect(path)).toBe(path);
    },
  );

  it.each([
    '//evil.com',
    '//evil.com/path',
    '/\\evil.com',
    '/foo\\bar',
    'https://evil.com',
    'http://localhost:5173/problems',
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'data:text/html,x',
    'problems',
    '',
    '/\t/evil.com',
    '/\n/evil.com',
    ' //evil.com',
  ])('refuses %j', (value) => {
    expect(safeRedirect(value)).toBe('/');
  });

  it('refuses values that are not a single string', () => {
    expect(safeRedirect(['/problems', '//evil.com'])).toBe('/');
    expect(safeRedirect(null)).toBe('/');
    expect(safeRedirect(undefined)).toBe('/');
  });
});

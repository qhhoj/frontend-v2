import { describe, expect, it } from 'vitest';
import { shortId } from './short-id';

describe('shortId', () => {
  it('keeps the first and last four characters of a uuid', () => {
    expect(shortId('0192c5a1-7e2f-7a31-9b4c-0e6d1f4a9c21')).toBe('0192…9c21');
  });
  it('leaves short values alone', () => {
    expect(shortId('abc')).toBe('abc');
  });
});

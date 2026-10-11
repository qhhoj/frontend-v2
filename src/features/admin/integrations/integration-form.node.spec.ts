import { describe, expect, it } from 'vitest';
import { cidrLines } from './integration-form';

describe('cidrLines', () => {
  it.each([
    ['10.0.0.0/8', ['10.0.0.0/8']],
    ['10.0.0.0/8\n192.168.1.0/24\n', ['10.0.0.0/8', '192.168.1.0/24']],
    ['  10.0.0.0/8 ,  2001:db8::/32 ', ['10.0.0.0/8', '2001:db8::/32']],
    ['\n\n', []],
  ])('reads %j as %j', (text, expected) => {
    expect(cidrLines(text)).toEqual(expected);
  });
});

import { describe, expect, it } from 'vitest';
import { matchPattern } from './route-match';

describe('matchPattern', () => {
  it('matches a literal key exactly and nothing else', () => {
    expect(matchPattern('GET /home', 'GET /home')).toEqual({});
    expect(matchPattern('GET /home', 'GET /homes')).toBeNull();
    expect(matchPattern('GET /home', 'GET /home/x')).toBeNull();
  });
  it('captures a :param segment, decoded', () => {
    expect(matchPattern('GET /problems/:code', 'GET /problems/a%2Fb')).toEqual({ code: 'a/b' });
    expect(matchPattern('GET /problems/:code', 'GET /problems')).toBeNull();
  });
  it('matches a trailing * against one or more remaining segments', () => {
    expect(matchPattern('GET /pages/*', 'GET /pages/about/rules')).toEqual({});
    expect(matchPattern('GET /pages/*', 'GET /pages/rules')).toEqual({});
    expect(matchPattern('GET /pages/*', 'GET /pages')).toBeNull();
    expect(matchPattern('GET /pages/*', 'GET /other/rules')).toBeNull();
  });
  it('captures a :param segment that comes before a trailing *', () => {
    expect(matchPattern('GET /users/:username/*', 'GET /users/ann/a/b')).toEqual({
      username: 'ann',
    });
    expect(matchPattern('GET /users/:username/*', 'GET /users/ann')).toBeNull();
    expect(matchPattern('GET /users/:username/*', 'GET /groups/ann/a')).toBeNull();
  });
});

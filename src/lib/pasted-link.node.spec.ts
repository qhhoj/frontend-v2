import { describe, expect, it } from 'vitest';
import { problemSearchIntent } from '@/features/problems/problem-search-input';
import { usernameFromInput } from '@/features/leaderboard/username-input';
import { pastedLinkSegment } from './pasted-link';

describe('pasted links in search boxes', () => {
  it('reads the segment after the section from a URL or a path, and nothing from other text', () => {
    expect(pastedLinkSegment('https://qhhoj.com/problems/aplusb?tab=x#y', 'problems')).toBe(
      'aplusb',
    );
    expect(pastedLinkSegment(' /problems/aplusb/best ', 'problems')).toBe('aplusb');
    expect(pastedLinkSegment('https://qhhoj.com/users/bit%20coder', 'users')).toBe('bit coder');
    expect(pastedLinkSegment('https://qhhoj.com/contests/hmu', 'problems')).toBeNull();
    expect(pastedLinkSegment('aplusb', 'problems')).toBeNull();
    expect(pastedLinkSegment('https://', 'problems')).toBeNull();
  });

  it('tells a pasted problem link from a typed code', () => {
    expect(problemSearchIntent('https://qhhoj.com/problems/aplusb')).toEqual({
      code: 'aplusb',
      isLink: true,
    });
    expect(problemSearchIntent('  APLUSB ')).toEqual({ code: 'APLUSB', isLink: false });
  });

  it('strips @ and profile links from a username', () => {
    expect(usernameFromInput('  @bitcoder ')).toBe('bitcoder');
    expect(usernameFromInput('https://qhhoj.com/users/bitcoder')).toBe('bitcoder');
    expect(usernameFromInput('https://qhhoj.com/user/bitcoder/')).toBe('bitcoder');
    expect(usernameFromInput('bitcoder')).toBe('bitcoder');
    expect(usernameFromInput('@')).toBe('');
  });
});

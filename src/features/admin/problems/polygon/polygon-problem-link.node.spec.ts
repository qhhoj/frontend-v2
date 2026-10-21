import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { linkRefusalOf, parsePolygonLink, polygonLinkUrl } from './polygon-problem-link';

const LINK = 'https://polygon.codeforces.com/p3n21nw/LamTerQH/qhh-evolution-ioi';

describe('parsePolygonLink', () => {
  it('reads the token, owner and name, ignoring spaces, a trailing slash, a query and a fragment', () => {
    const parts = { token: 'p3n21nw', owner: 'LamTerQH', name: 'qhh-evolution-ioi' };
    expect(parsePolygonLink(LINK)).toEqual(parts);
    expect(parsePolygonLink(` ${LINK}/?ccid=1#x `)).toEqual(parts);
  });

  it.each([
    ['a look-alike host', LINK.replace('codeforces.com', 'codeforces.com.evil.io')],
    ['credentials', LINK.replace('https://', 'https://a:b@')],
    ['no token', 'https://polygon.codeforces.com/LamTerQH/qhh-evolution-ioi'],
    ['a token of the wrong shape', LINK.replace('p3n21nw', 'p3n21')],
    ['an extra segment', `${LINK}/tests`],
    ['not a URL', 'LamTerQH/qhh-evolution-ioi'],
  ])('refuses %s', (_case, text) => {
    expect(parsePolygonLink(text)).toBeNull();
  });
});

describe('parsePolygonLink normalisation', () => {
  const parts = { token: 'p3n21nw', owner: 'LamTerQH', name: 'qhh-evolution-ioi' };
  const BARE = LINK.replace('https://', '');

  it.each([
    ['http', LINK.replace('https:', 'http:')],
    ['no scheme', BARE],
    ['no scheme, upper-case host', BARE.replace('polygon', 'POLYGON')],
    ['a trailing dot', `${LINK}.`],
    ['wrapping angle brackets', `<${LINK}>`],
    ['brackets and a trailing dot', `<${LINK}>.`],
    ['http with spaces around', `  ${LINK.replace('https:', 'http:')}  `],
  ])('reads %s as the https link', (_case, text) => {
    expect(parsePolygonLink(text)).toEqual(parts);
  });

  it('builds the https address the server is asked about', () => {
    expect(polygonLinkUrl(parts)).toBe(LINK);
  });

  it.each([
    [
      'a look-alike host without a scheme',
      BARE.replace('codeforces.com', 'codeforces.com.evil.io'),
    ],
    ['ftp', LINK.replace('https:', 'ftp:')],
    ['a trailing double slash', `${LINK}//`],
  ])('still refuses %s', (_case, text) => {
    expect(parsePolygonLink(text)).toBeNull();
  });
});

describe('linkRefusalOf', () => {
  const refusal = (code: string, extra: Record<string, unknown> = {}) =>
    linkRefusalOf(new ApiError(code, 409, 'refused', { extra }));

  it('tells the four link refusals apart by code', () => {
    expect(refusal('polygon_link_invalid')).toEqual({ kind: 'invalid' });
    expect(refusal('polygon_link_refused')).toEqual({ kind: 'refused' });
    expect(refusal('polygon_no_package')).toEqual({ kind: 'noPackage' });
    expect(refusal('polygon_package_not_ready')).toEqual({ kind: 'notReady' });
  });

  it('names the linked problem only when the server sent its code', () => {
    expect(refusal('polygon_already_linked', { linkedProblemCode: 'qhhdisc' })).toEqual({
      kind: 'linked',
      code: 'qhhdisc',
    });
    expect(refusal('polygon_already_linked')).toEqual({ kind: 'linked', code: null });
  });

  it('leaves any other failure to the generic failure line', () => {
    const limited = new ApiError('rate_limited', 429, 'slow down');
    expect(linkRefusalOf(limited)).toEqual({ kind: 'other', error: limited });
  });
});

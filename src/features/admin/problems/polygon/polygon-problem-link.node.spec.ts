import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import {
  linkRefusalOf,
  parsePolygonLink,
  polygonLinkUrl,
  textRefusalOf,
} from './polygon-problem-link';

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

describe('textRefusalOf', () => {
  it.each([
    ['empty text', '  '],
    ['a problem link', LINK],
    ['a problem link with its editing session', `${LINK}?ccid=a1b2&session=d4e5`],
  ])('has nothing to say about %s', (_case, text) => {
    expect(textRefusalOf(text)).toBeNull();
  });

  it.each([
    ['a session page', 'https://polygon.codeforces.com/generalInfo?ccid=a1b2c3&session=d4e5f6'],
    ['the edit-start page', 'https://polygon.codeforces.com/edit-start?problemId=595944'],
    ['a session page without a scheme', 'polygon.codeforces.com/tests?ccid=1&session=2'],
  ])('calls %s an editing address', (_case, text) => {
    expect(textRefusalOf(text)).toEqual({ kind: 'editing' });
  });

  it.each([
    ['another host with a session', 'https://codeforces.com/problemset?session=1'],
    ['a Polygon page without a session', 'https://polygon.codeforces.com/problems'],
    ['plain words', 'kminmax'],
  ])('calls %s not a link', (_case, text) => {
    expect(textRefusalOf(text)).toEqual({ kind: 'invalid' });
  });
});

describe('linkRefusalOf', () => {
  const refusal = (code: string, extra: Record<string, unknown> = {}, status = 409) =>
    linkRefusalOf(new ApiError(code, status, 'refused', { extra, retryAfterSeconds: 60 }));

  it('tells the fixed link refusals apart by code', () => {
    expect(refusal('polygon_link_invalid')).toEqual({ kind: 'invalid' });
    expect(refusal('polygon_link_refused')).toEqual({ kind: 'refused' });
    expect(refusal('polygon_no_package')).toEqual({ kind: 'noPackage' });
  });

  it("carries Polygon's newest package and its comment when none is READY", () => {
    const newest = { id: 1100002, revision: 11, state: 'FAILED', comment: 'wa.cpp passed' };
    expect(refusal('polygon_package_not_ready', { newestPackage: newest })).toEqual({
      kind: 'notReady',
      newest,
    });
  });

  it.each([
    ['missing', undefined],
    ['of an unknown state', { id: 1, revision: 2, state: 'READY', comment: null }],
    ['without a revision', { id: 1, state: 'RUNNING', comment: null }],
  ])('drops a newest package %s', (_case, newestPackage) => {
    expect(refusal('polygon_package_not_ready', { newestPackage })).toEqual({
      kind: 'notReady',
      newest: null,
    });
  });

  it('reads an empty comment as none', () => {
    const newest = { id: 1, revision: 2, state: 'RUNNING', comment: '' };
    expect(refusal('polygon_package_not_ready', { newestPackage: newest })).toEqual({
      kind: 'notReady',
      newest: { ...newest, comment: null },
    });
  });

  it('reads a running first check and a proxy timeout as "still checking"', () => {
    const checking = { kind: 'checking', retryAfterSeconds: 60 };
    expect(refusal('polygon_link_checking')).toEqual(checking);
    expect(refusal('http_error', {}, 504)).toEqual(checking);
  });

  it('names the linked problem only when the server sent its code', () => {
    expect(refusal('polygon_already_linked', { linkedProblemCode: 'qhhdisc' })).toEqual({
      kind: 'linked',
      code: 'qhhdisc',
    });
    expect(refusal('polygon_already_linked')).toEqual({ kind: 'linked', code: null });
  });

  it('tells a link held by a deleted problem from a live one', () => {
    expect(refusal('polygon_linked_deleted', { linkedProblemCode: 'abc' })).toEqual({
      kind: 'linkedDeleted',
      code: 'abc',
    });
    expect(refusal('polygon_linked_deleted')).toEqual({ kind: 'linkedDeleted', code: null });
  });

  it('leaves any other failure to the generic failure line', () => {
    const limited = new ApiError('rate_limited', 429, 'slow down');
    expect(linkRefusalOf(limited)).toEqual({ kind: 'other', error: limited });
  });
});

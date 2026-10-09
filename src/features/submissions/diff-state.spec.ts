import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { MAX_DIFF_LINES } from '@/lib/line-diff';
import { diffPairOf, parseSubmissionRef, toggleDiffPick } from './diff-picks';
import { diffViewState } from './diff-state';
import type { DiffSideInput } from './diff-state';

const ID = '0192a000-0000-7000-8000-000000000001';
const OTHER = '0192a000-0000-7000-8000-000000000002';
const loaded = (source = 'a\nb'): DiffSideInput => ({ isPending: false, errors: [], source });
const failed = (status: number, code: string): DiffSideInput => ({
  isPending: false,
  errors: [null, new ApiError(code, status, code)],
  source: undefined,
});

describe('parseSubmissionRef', () => {
  it.each([
    [ID, ID],
    [`  ${ID}  `, ID],
    [`#${ID}`, ID],
    [`https://qhhoj.vn/submissions/${ID}`, ID],
    [`/submissions/${ID}?tab=cases#top`, ID],
    ['sub-1', 'sub-1'],
  ])('reads %j as %j', (text, expected) => {
    expect(parseSubmissionRef(text)).toBe(expected);
  });

  it.each(['', '   ', 'not an id!', '../admin', '/submissions/diff', 'x'.repeat(65)])(
    'refuses %j',
    (text) => {
      expect(parseSubmissionRef(text)).toBeNull();
    },
  );
});

describe('diffPairOf', () => {
  it('takes both ids from the query', () => {
    expect(diffPairOf({ left: ID, right: OTHER })).toEqual({ left: ID, right: OTHER });
  });

  it.each([
    ['no ids', {}],
    ['one id', { left: ID }],
    ['the same id twice', { left: ID, right: ID }],
    ['a repeated parameter', { left: [ID, OTHER], right: OTHER }],
    ['a bad id', { left: 'a b', right: OTHER }],
  ])('is null for %s', (_name, query) => {
    expect(diffPairOf(query)).toBeNull();
  });
});

describe('toggleDiffPick', () => {
  it('picks in order, at most two, and unpicking frees a slot', () => {
    const one = toggleDiffPick([], 'a');
    const two = toggleDiffPick(one, 'b');
    expect(two).toEqual(['a', 'b']);
    expect(toggleDiffPick(two, 'c')).toEqual(['a', 'b']);
    expect(toggleDiffPick(two, 'a')).toEqual(['b']);
    expect(toggleDiffPick(toggleDiffPick(two, 'a'), 'c')).toEqual(['b', 'c']);
  });

  it('never changes the list it was given', () => {
    const picked = ['a'];
    toggleDiffPick(picked, 'b');
    expect(picked).toEqual(['a']);
  });
});

describe('diffViewState', () => {
  it('is ready with both sources', () => {
    expect(diffViewState({ left: loaded('x'), right: loaded('y') })).toEqual({
      kind: 'ready',
      leftSource: 'x',
      rightSource: 'y',
    });
  });

  it('names the forbidden side, even while the other side still loads', () => {
    const pending: DiffSideInput = { isPending: true, errors: [], source: undefined };
    expect(diffViewState({ left: failed(403, 'solve_first'), right: pending })).toEqual({
      kind: 'forbidden',
      side: 'left',
    });
    expect(diffViewState({ left: loaded(), right: failed(403, 'hidden') })).toEqual({
      kind: 'forbidden',
      side: 'right',
    });
  });

  it('puts a forbidden side before a missing one, and a missing one before a failed load', () => {
    expect(
      diffViewState({ left: failed(404, 'not_found'), right: failed(403, 'forbidden') }),
    ).toEqual({ kind: 'forbidden', side: 'right' });
    expect(
      diffViewState({ left: failed(500, 'generic'), right: failed(404, 'not_found') }),
    ).toEqual({ kind: 'notFound', side: 'right' });
    expect(diffViewState({ left: failed(500, 'generic'), right: loaded() })).toEqual({
      kind: 'error',
      side: 'left',
    });
  });

  it('treats a network failure that is not an ApiError as a load error', () => {
    const side: DiffSideInput = {
      isPending: false,
      errors: [new TypeError('x')],
      source: undefined,
    };
    expect(diffViewState({ left: loaded(), right: side })).toEqual({
      kind: 'error',
      side: 'right',
    });
  });

  it('loads while either source is missing', () => {
    expect(
      diffViewState({ left: loaded(), right: { isPending: true, errors: [], source: undefined } }),
    ).toEqual({ kind: 'loading' });
  });

  it('refuses above the line limit and names the longer side', () => {
    const long = Array.from({ length: MAX_DIFF_LINES + 240 }, () => 'x').join('\n');
    expect(diffViewState({ left: loaded(), right: loaded(long) })).toEqual({
      kind: 'tooLong',
      lineCount: MAX_DIFF_LINES + 240,
    });
    const atLimit = Array.from({ length: MAX_DIFF_LINES }, () => 'x').join('\n');
    expect(diffViewState({ left: loaded(atLimit), right: loaded() }).kind).toBe('ready');
  });
});

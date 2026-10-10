import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { commentFailureOf, reportFailureKey } from './comment-failure';

describe('commentFailureOf', () => {
  it('names the post rate on a 429 and the wait when the server sent one', () => {
    expect(commentFailureOf(new ApiError('rate_limited', 429, 'x'))).toEqual({
      key: 'comments.failure.rateLimited',
      params: { limit: 10, minutes: 5 },
      refreshesPage: false,
    });
    expect(
      commentFailureOf(new ApiError('rate_limited', 429, 'x', { retryAfterSeconds: 42 })),
    ).toMatchObject({ key: 'comments.failure.rateLimitedWait', params: { seconds: 42 } });
  });

  it('refetches the page on refusals that mean it changed: a lock or gate, an edit elsewhere, a parent gone', () => {
    for (const [code, status, key] of [
      ['forbidden', 403, 'comments.failure.forbidden'],
      ['conflict', 409, 'comments.failure.conflict'],
      ['not_found', 404, 'comments.failure.gone'],
    ] as const)
      expect(commentFailureOf(new ApiError(code, status, 'x'))).toEqual({
        key,
        params: {},
        refreshesPage: true,
      });
  });

  it('explains a 400 with the length limit and falls back to the shared error text otherwise', () => {
    expect(commentFailureOf(new ApiError('validation_failed', 400, 'x'))).toMatchObject({
      key: 'comments.failure.invalid',
      params: { max: 8192 },
    });
    expect(commentFailureOf(new TypeError('offline'))).toMatchObject({
      key: 'errors.generic',
      refreshesPage: false,
    });
  });
});

describe('reportFailureKey', () => {
  it('says why a report was refused', () => {
    expect(reportFailureKey(new ApiError('conflict', 409, 'x'))).toBe('comments.report.already');
    expect(reportFailureKey(new ApiError('rate_limited', 429, 'x'))).toBe(
      'comments.report.rateLimited',
    );
    expect(reportFailureKey(new ApiError('not_found', 404, 'x'))).toBe('comments.report.gone');
    expect(reportFailureKey(new ApiError('forbidden', 403, 'x'))).toBe('comments.report.own');
  });
});

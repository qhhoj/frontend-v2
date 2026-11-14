import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { shareFailureOf } from './share-failure';

const refusal = (code: string, status: number, issueCode?: string) =>
  new ApiError(code, status, 'x', {
    issues: issueCode ? [{ field: 'source', code: issueCode, message: 'x' }] : [],
  });

describe('shareFailureOf', () => {
  it('tells the two blocks from other failures', () => {
    expect(shareFailureOf(refusal('contest_running', 403))).toEqual({ kind: 'contest' });
    expect(shareFailureOf(refusal('hidden', 403))).toEqual({ kind: 'hidden' });
  });

  it('names a refusal by its issue, whatever the code around it', () => {
    expect(shareFailureOf(refusal('conflict', 409, 'share_limit'))).toEqual({
      kind: 'other',
      key: 'share.error.share_limit',
    });
    expect(shareFailureOf(refusal('validation_failed', 400, 'source_too_large'))).toEqual({
      kind: 'other',
      key: 'share.error.source_too_large',
    });
  });

  it('falls back to the generic message for anything else', () => {
    expect(shareFailureOf(new Error('boom'))).toEqual({ kind: 'other', key: 'errors.generic' });
  });
});

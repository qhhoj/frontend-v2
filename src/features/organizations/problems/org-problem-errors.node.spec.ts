import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { orgFailureText } from './org-problem-errors';

const refusal = (status: number, code: string, issueCode?: string, retryAfterSeconds?: number) =>
  new ApiError(code, status, 'English message', {
    issues: issueCode ? [{ field: 'tagIds', code: issueCode, message: 'English message' }] : [],
    retryAfterSeconds,
  });

describe('orgFailureText', () => {
  it('names an unknown tag by its issue code, not by the status', () => {
    expect(orgFailureText(refusal(400, 'validation_failed', 'unknown_tag'))).toContain('Thẻ');
  });

  it('tells a taken tag code from the 100-tag limit although both are 409', () => {
    const taken = orgFailureText(refusal(409, 'conflict', 'slug_taken'));
    const full = orgFailureText(refusal(409, 'conflict', 'tag_limit_reached'));
    expect(taken).toContain('Mã thẻ');
    expect(full).toContain('100');
    expect(taken).not.toBe(full);
  });

  it('falls back to the generic text and appends the wait of a rate limit', () => {
    expect(orgFailureText(refusal(429, 'rate_limited', undefined, 600))).toContain('600');
  });
});

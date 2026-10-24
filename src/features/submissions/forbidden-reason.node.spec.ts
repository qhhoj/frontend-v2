import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { forbiddenMessageKey, forbiddenReasonKey } from './forbidden-reason';

describe('forbiddenReasonKey', () => {
  it('maps each reason code to its own text key and anything else to null', () => {
    for (const code of ['solve_first', 'contest_running', 'hidden'])
      expect(forbiddenReasonKey(new ApiError(code, 403, 'x'))).toBe(`submission.forbidden.${code}`);
    expect(forbiddenReasonKey(new ApiError('forbidden', 403, 'x'))).toBeNull();
    expect(forbiddenReasonKey(new ApiError('solve_first', 404, 'x'))).toBeNull();
    expect(forbiddenReasonKey(new Error('x'))).toBeNull();
  });
});

describe('forbiddenMessageKey', () => {
  it('falls back to the generic forbidden text for any other 403 and is null for other errors', () => {
    expect(forbiddenMessageKey(new ApiError('hidden', 403, 'x'))).toBe(
      'submission.forbidden.hidden',
    );
    expect(forbiddenMessageKey(new ApiError('whatever', 403, 'x'))).toBe('errors.forbidden');
    expect(forbiddenMessageKey(new ApiError('not_found', 404, 'x'))).toBeNull();
    expect(forbiddenMessageKey(null)).toBeNull();
  });
});

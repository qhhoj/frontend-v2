import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { endsSession } from './use-chunked-upload';

describe('endsSession', () => {
  it('ends the session when the problem was renamed, so no resume is offered', () => {
    const renamed = new ApiError('conflict', 409, 'renamed', {
      issues: [{ field: 'code', code: 'problem_renamed', message: 'renamed' }],
    });
    expect(endsSession(renamed)).toBe(true);
    expect(endsSession(new ApiError('http_error', 502, 'Bad gateway'))).toBe(false);
  });
});

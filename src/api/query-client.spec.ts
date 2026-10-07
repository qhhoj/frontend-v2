import { describe, expect, it } from 'vitest';
import { ApiError } from './client';
import { shouldRetry } from './query-client';

describe('shouldRetry', () => {
  it('never retries a client error', () => {
    expect(shouldRetry(0, new ApiError('not_found', 404, 'x'))).toBe(false);
    expect(shouldRetry(0, new ApiError('rate_limited', 429, 'x'))).toBe(false);
  });

  it('retries a server or network error once', () => {
    expect(shouldRetry(0, new ApiError('internal_error', 500, 'x'))).toBe(true);
    expect(shouldRetry(0, new ApiError('network_error', 0, 'x'))).toBe(true);
    expect(shouldRetry(1, new ApiError('internal_error', 500, 'x'))).toBe(false);
  });
});

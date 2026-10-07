import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { errorMessageKey } from './error-message';

describe('errorMessageKey', () => {
  it('uses the message of a known error code', () => {
    expect(errorMessageKey(new ApiError('invalid_credentials', 401, 'x'))).toBe(
      'errors.invalid_credentials',
    );
  });

  it('falls back to the generic message for unknown codes and non-API errors', () => {
    expect(errorMessageKey(new ApiError('teapot', 418, 'x'))).toBe('errors.generic');
    expect(errorMessageKey(new Error('boom'))).toBe('errors.generic');
  });
});

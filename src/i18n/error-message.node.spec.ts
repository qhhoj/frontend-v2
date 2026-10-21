import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { errorMessageKey } from './error-message';

describe('errorMessageKey', () => {
  it('tells a frozen or hidden board apart from a plain 403 by its issue code', () => {
    const refusal = (issueCode: string) =>
      new ApiError('forbidden', 403, 'x', {
        issues: [{ field: '', code: issueCode, message: 'x' }],
      });
    expect(errorMessageKey(refusal('board_frozen'))).toBe('errors.board_frozen');
    expect(errorMessageKey(refusal('board_hidden'))).toBe('errors.board_hidden');
    expect(errorMessageKey(refusal('forbidden'))).toBe('errors.forbidden');
  });

  it('names a body over the limit by its status, whatever code the server sent', () => {
    expect(errorMessageKey(new ApiError('http_error', 413, 'x'))).toBe('errors.payload_too_large');
  });

  it('lets a refusal with its own text win over the generic 413 text', () => {
    const tooLarge = new ApiError('polygon_package_too_large', 413, 'x');
    expect(errorMessageKey(tooLarge)).toBe('errors.polygon_package_too_large');
  });

  it('falls back to the generic message for unknown codes and non-API errors', () => {
    expect(errorMessageKey(new ApiError('teapot', 418, 'x'))).toBe('errors.generic');
    expect(errorMessageKey(new Error('boom'))).toBe('errors.generic');
  });
});

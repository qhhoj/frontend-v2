import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { failureReasonOf } from './failure-reason';

describe('failureReasonOf', () => {
  it('shows the reason a validation refusal names for its field', () => {
    const error = new ApiError('validation_failed', 400, 'Some fields are invalid', {
      fields: { file: ['Only JPG, PNG, GIF and SVG images are accepted.'] },
    });
    expect(failureReasonOf(error)).toBe('Only JPG, PNG, GIF and SVG images are accepted.');
  });

  it('shows the SPA text for an issue code before the backend message', () => {
    const error = new ApiError('validation_failed', 400, 'Some fields are invalid', {
      issues: [{ field: 'name', code: 'max_length', message: 'name is too long' }],
    });
    expect(failureReasonOf(error)).toBe('Quá dài.');
  });

  it('falls back to the usual line for a refusal that names no field', () => {
    const error = new ApiError('rate_limited', 429, 'slow down');
    expect(failureReasonOf(error)).toContain('Bạn thao tác quá nhanh');
  });
});

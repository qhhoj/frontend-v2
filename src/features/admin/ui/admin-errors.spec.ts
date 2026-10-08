import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { failureTextOf, fieldErrorsOf } from './admin-errors';

describe('fieldErrorsOf', () => {
  it('turns issues into one text per field, with the SPA text when it has one', () => {
    const error = new ApiError('validation_failed', 400, 'bad', {}, [
      { field: 'timeLimit', code: 'max', message: 'timeLimit must not be greater than 60' },
      { field: 'problems.2.points', code: 'whatever_new', message: 'points too big' },
    ]);
    expect(fieldErrorsOf(error)).toEqual({
      timeLimit: 'Giá trị quá lớn.',
      'problems.2.points': 'points too big',
    });
  });

  it('falls back to the fields map when the backend sent no issues (the reserved ban reason)', () => {
    const error = new ApiError('validation_failed', 400, 'Reserved ban reason', {
      reason: ['Reserved for automatic contest-cheating bans.', 'second'],
    });
    expect(fieldErrorsOf(error)).toEqual({
      reason: 'Reserved for automatic contest-cheating bans.',
    });
  });

  it('keeps the first issue of a field and ignores anything that is not an ApiError', () => {
    const error = new ApiError('validation_failed', 400, 'bad', {}, [
      { field: 'code', code: 'matches', message: 'a' },
      { field: 'code', code: 'max_length', message: 'b' },
    ]);
    expect(fieldErrorsOf(error)).toEqual({ code: 'Định dạng chưa đúng.' });
    expect(fieldErrorsOf(new Error('x'))).toEqual({});
  });

  it('words a failed write by its code and adds the wait when the refusal said how long', () => {
    expect(failureTextOf(new ApiError('rate_limited', 429, 'x'))).toBe(
      'Bạn thao tác quá nhanh. Hãy thử lại sau.',
    );
    expect(failureTextOf(new ApiError('rate_limited', 429, 'x', {}, [], {}, 42))).toBe(
      'Bạn thao tác quá nhanh. Hãy thử lại sau. Thử lại sau 42 giây.',
    );
  });

  it.each(['is_int', 'is_in', 'is_number', 'is_boolean', 'is_url', 'is_object'])(
    'has Vietnamese text for the %s code the DTOs emit, not the backend English',
    (code) => {
      const error = new ApiError('validation_failed', 400, 'bad', {}, [
        { field: 'x', code, message: 'x must be something' },
      ]);
      expect(fieldErrorsOf(error).x).not.toBe('x must be something');
    },
  );
});

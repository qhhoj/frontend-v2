import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { failureReasonOf } from './failure-reason';

const refused = (code: string, message = 'English message') =>
  new ApiError('validation_failed', 400, 'Some fields are invalid', {
    issues: [{ field: 'file', code, message }],
  });

/** Samples of the file-refusal codes: the text is Vietnamese, never the backend English. */
const CODE_TABLE: [string, string][] = [
  ['file_empty', 'Tệp rỗng; hãy chọn tệp khác.'],
  ['zip_too_large', 'Tệp zip quá lớn.'],
  ['code_taken', 'Mã bài này đã có.'],
];

describe('failureReasonOf', () => {
  it.each(CODE_TABLE)('shows the Vietnamese text of the code %s', (code, text) => {
    expect(failureReasonOf(refused(code))).toBe(text);
  });

  it('shows the SPA text for a validator code before any backend message', () => {
    expect(failureReasonOf(refused('max_length', 'name is too long'))).toBe('Quá dài.');
  });

  it('falls back to the usual line for a code the SPA does not know, never the English', () => {
    const text = failureReasonOf(refused('mystery', 'English only'));
    expect(text).not.toContain('English');
    expect(text).toBe(failureReasonOf(new ApiError('validation_failed', 400, 'x')));
  });

  it('does not read the English message of a file refusal', () => {
    const error = new ApiError('validation_failed', 400, 'x', {
      fields: { file: ['Only JPG, PNG, GIF and SVG images are accepted.'] },
      issues: [
        {
          field: 'file',
          code: 'invalid',
          message: 'Only JPG, PNG, GIF and SVG images are accepted.',
        },
      ],
    });
    expect(failureReasonOf(error)).not.toContain('JPG');
  });

  it('falls back to the usual line for a refusal that names no field', () => {
    const error = new ApiError('rate_limited', 429, 'slow down');
    expect(failureReasonOf(error)).toContain('Bạn thao tác quá nhanh');
  });
});

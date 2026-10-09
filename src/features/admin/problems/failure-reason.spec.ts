import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { failureReasonOf, refusalTextOf } from './failure-reason';

const GENERIC = 'Tệp không được nhận. Hãy kiểm tra lại tệp rồi thử lại.';

/** Every exact backend message and the Vietnamese text it must show. */
const EXACT_TABLE: [string, string][] = [
  [
    'Unexpected, repeated or oversized field.',
    'Trường hoặc tệp gửi lên không đúng, bị lặp hoặc quá lớn.',
  ],
  ['Send exactly one file in the "file" field.', 'Hãy gửi đúng một tệp trong trường "file".'],
  ['The upload is malformed.', 'Yêu cầu tải lên không hợp lệ.'],
  ['A file is required.', 'Cần chọn một tệp.'],
  ['A non-empty file is required.', 'Tệp rỗng; hãy chọn tệp khác.'],
  ['The SVG is too large or too complex.', 'Tệp SVG quá lớn hoặc quá phức tạp.'],
  ['Only JPG, PNG, GIF and SVG images are accepted.', 'Chỉ nhận ảnh JPG, PNG, GIF hoặc SVG.'],
  ['The statement must be a PDF file.', 'Đề bài phải là tệp PDF.'],
  [
    'This file type is not allowed as problem material.',
    'Loại tệp này không được phép làm tài liệu của bài.',
  ],
  ['The archive must be a .zip file.', 'Tệp phải là .zip.'],
  ['The package has no problem.xml at its root.', 'Gói không có problem.xml ở thư mục gốc.'],
  ['Archive central directory is inconsistent.', 'Mục lục của tệp zip không nhất quán.'],
  ['The archive is not a valid zip file.', 'Tệp không phải là zip hợp lệ.'],
  ['The archive points outside itself.', 'Tệp zip tham chiếu ra ngoài chính nó.'],
];

/** The messages that carry a name, with the names the backend fills in. */
const PATTERN_TABLE: [string, string][] = [
  [
    'The name 1.in is already used by another data file.',
    'Tên 1.in đã được dùng bởi một tệp dữ liệu khác.',
  ],
  [
    'Allowed extensions for generator: cpp, cc, c, pas, java, py',
    'Phần mở rộng cho Bộ sinh test (generator) chỉ gồm: cpp, cc, c, pas, java, py.',
  ],
  [
    'The archive is not a valid zip file: end of central directory not found',
    'Tệp không phải là zip hợp lệ.',
  ],
  ['sub1/01.in is corrupt: its checksum does not match', 'sub1/01.in bị hỏng; hãy nén lại tệp.'],
  [
    'sub1/01.in does not match its declared size',
    'sub1/01.in không khớp với kích thước đã khai báo.',
  ],
  ['sub1/01.in is too large to read', 'sub1/01.in quá lớn để đọc.'],
  ['No such file in the archive: 1.out', 'Không có tệp 1.out trong gói.'],
  ['Cannot read 1.in: unknown error', 'Không đọc được 1.in.'],
];

describe('refusalTextOf', () => {
  it.each(EXACT_TABLE)(
    'maps the exact backend message %s to its Vietnamese text',
    (message, text) => {
      expect(refusalTextOf(message)).toBe(text);
    },
  );

  it.each(PATTERN_TABLE)(
    'maps the name-carrying message %s to its Vietnamese text',
    (message, text) => {
      expect(refusalTextOf(message)).toBe(text);
    },
  );

  it('gives the generic Vietnamese text for an unknown message, never the English', () => {
    expect(refusalTextOf('Something the backend never said before.')).toBe(GENERIC);
  });

  it('does not match a known message with extra words: the exact table is exact', () => {
    expect(refusalTextOf('The upload is malformed. Try again.')).toBe(GENERIC);
  });
});

describe('failureReasonOf', () => {
  it('shows the Vietnamese reason a file refusal names', () => {
    const error = new ApiError('validation_failed', 400, 'Some fields are invalid', {
      fields: { file: ['Only JPG, PNG, GIF and SVG images are accepted.'] },
    });
    expect(failureReasonOf(error)).toBe('Chỉ nhận ảnh JPG, PNG, GIF hoặc SVG.');
  });

  it('shows the SPA text for an issue code before any backend message', () => {
    const error = new ApiError('validation_failed', 400, 'Some fields are invalid', {
      issues: [{ field: 'name', code: 'max_length', message: 'name is too long' }],
    });
    expect(failureReasonOf(error)).toBe('Quá dài.');
  });

  it('shows the generic Vietnamese text for an issue code the SPA does not know', () => {
    const error = new ApiError('validation_failed', 400, 'Some fields are invalid', {
      issues: [{ field: 'name', code: 'mystery', message: 'name is odd' }],
    });
    expect(failureReasonOf(error)).toBe(GENERIC);
  });

  it('falls back to the usual line for a refusal that names no field', () => {
    const error = new ApiError('rate_limited', 429, 'slow down');
    expect(failureReasonOf(error)).toContain('Bạn thao tác quá nhanh');
  });
});

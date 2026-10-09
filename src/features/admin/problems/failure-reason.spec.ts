import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { failureReasonOf } from './failure-reason';

const refused = (code: string, message = 'English message') =>
  new ApiError('validation_failed', 400, 'Some fields are invalid', {
    issues: [{ field: 'file', code, message }],
  });

/** Every file-refusal and taken-code the backend sends, and the Vietnamese text it must show. */
const CODE_TABLE: [string, string][] = [
  ['unexpected_field', 'Trường hoặc tệp gửi lên không đúng, bị lặp hoặc quá lớn.'],
  ['exactly_one_file', 'Hãy gửi đúng một tệp trong trường "file".'],
  ['upload_malformed', 'Yêu cầu tải lên không hợp lệ.'],
  ['file_required', 'Cần chọn một tệp.'],
  ['file_empty', 'Tệp rỗng; hãy chọn tệp khác.'],
  ['svg_too_large', 'Tệp SVG quá lớn hoặc quá phức tạp.'],
  ['image_type_not_allowed', 'Chỉ nhận ảnh JPG, PNG, GIF hoặc SVG.'],
  ['statement_not_pdf', 'Đề bài phải là tệp PDF.'],
  ['material_type_not_allowed', 'Loại tệp này không được phép làm tài liệu của bài.'],
  ['zip_required', 'Tệp phải là .zip.'],
  ['extension_not_allowed', 'Phần mở rộng của tệp không được phép cho loại này.'],
  ['data_file_name_taken', 'Tên này đã được dùng bởi một tệp dữ liệu khác.'],
  ['no_problem_xml', 'Gói không có problem.xml ở thư mục gốc.'],
  ['zip_invalid', 'Tệp không phải là zip hợp lệ.'],
  ['zip_inconsistent', 'Mục lục của tệp zip không nhất quán.'],
  ['zip_entry_rejected', 'Gói chứa một tệp không được nhận.'],
  ['zip_duplicate_entry', 'Gói chứa hai tệp trùng tên.'],
  ['zip_too_large', 'Tệp zip quá lớn.'],
  ['zip_entry_corrupt', 'Một tệp trong gói bị hỏng; hãy nén lại.'],
  ['zip_points_outside', 'Tệp zip tham chiếu ra ngoài chính nó.'],
  ['zip_entry_too_large', 'Một tệp trong gói quá lớn.'],
  ['zip_entry_unreadable', 'Không đọc được một tệp trong gói.'],
  ['zip_entry_missing', 'Gói thiếu một tệp được khai báo.'],
  ['code_taken', 'Mã bài này đã có.'],
  ['data_directory_taken', 'Thư mục dữ liệu này đã có bài khác dùng.'],
  ['time_limit_too_high', 'Giới hạn thời gian quá cao.'],
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

import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { issue } from '@/test/mock-api';
import { invalidSummary, lengthErrors, saveErrorText, serverFieldErrors } from './profile-errors';

/** What the backend answers today: `issues` (code + field) next to the older `fields` map. */
const issuesError = (field: string, code: string) =>
  new ApiError('validation_failed', 400, 'Bad', {
    issues: [issue(field, code, `English prose about ${field}`)],
  });
/** An older backend, and the fallback for a field without an issue code. */
const fieldsError = (fields: Record<string, string[]>) =>
  new ApiError('validation_failed', 400, 'Bad', { fields });

describe('serverFieldErrors', () => {
  it.each([
    ['firstName', 'max_length', 'Tên hiển thị chưa hợp lệ.'],
    [
      'timezone',
      'is_time_zone',
      'Múi giờ không hợp lệ. Hãy chọn một múi giờ trong danh sách (ví dụ Asia/Ho_Chi_Minh).',
    ],
    [
      'languageId',
      'unknown_language',
      'Ngôn ngữ này không còn trên trang. Hãy chọn ngôn ngữ khác.',
    ],
    [
      'organizations',
      'organizations_not_editable',
      'Chỉ sắp xếp hoặc rời các tổ chức bạn đang tham gia. Muốn tham gia thêm, vào trang tổ chức.',
    ],
  ])(
    'gives %s (%s) its own Vietnamese sentence, never the English message',
    (field, code, sentence) => {
      expect(serverFieldErrors(issuesError(field, code))).toEqual({ [field]: sentence });
    },
  );

  it('still reads an older backend that sends only the fields map', () => {
    expect(
      serverFieldErrors(fieldsError({ timezone: ['Must be an IANA time zone name.'] })),
    ).toEqual({
      timezone:
        'Múi giờ không hợp lệ. Hãy chọn một múi giờ trong danh sách (ví dụ Asia/Ho_Chi_Minh).',
    });
  });

  it('falls back to the backend message for a field the form does not know', () => {
    expect(serverFieldErrors(fieldsError({ userScript: ['Too long.'] }))).toEqual({
      userScript: 'Too long.',
    });
  });

  it('is empty for an error without fields', () => {
    expect(serverFieldErrors(new ApiError('network_error', 0, 'Network error'))).toEqual({});
  });
});

describe('lengthErrors', () => {
  it('says the limit, the count used and, for the about text, how much to remove, in local digits', () => {
    expect(
      lengthErrors(
        [
          { field: 'firstName', used: 54, max: 30 },
          { field: 'about', used: 65_912, max: 65_536 },
        ],
        'vi',
      ),
    ).toEqual({
      firstName: 'Tên hiển thị tối đa 30 ký tự (đang dùng 54).',
      about: 'Phần giới thiệu dài quá 65.536 ký tự. Hãy xoá bớt 376 ký tự.',
    });
  });
});

describe('saveErrorText', () => {
  it.each([
    ['forbidden', 403, 'Chưa lưu được tên hoặc phần giới thiệu'],
    ['conflict', 409, 'Chưa lưu được danh sách tổ chức'],
    ['network_error', 0, 'Mất kết nối'],
    ['rate_limited', 429, 'Bạn thao tác quá nhanh'],
    ['teapot', 418, 'Đã có lỗi xảy ra'],
  ])('explains %s', (code, status, start) => {
    expect(saveErrorText(new ApiError(code, status, code))).toMatch(new RegExp(`^${start}`));
  });

  it('is null when the fields explain the failure, and when nothing failed', () => {
    expect(saveErrorText(fieldsError({ timezone: ['x'] }))).toBeNull();
    expect(saveErrorText(null)).toBeNull();
  });
});

describe('invalidSummary', () => {
  it('names the fields to fix as a sentence', () => {
    expect(invalidSummary(['firstName', 'about'], 'vi')).toBe(
      'Chưa lưu được. Có 2 mục cần sửa: Tên hiển thị và Giới thiệu bản thân. Các thay đổi khác của bạn vẫn còn trên trang.',
    );
  });
});

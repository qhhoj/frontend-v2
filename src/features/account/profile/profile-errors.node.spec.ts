import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { issue } from '@/test/mock-api';
import { lengthErrors, saveErrorText, serverFieldErrors } from './profile-errors';

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
    expect(serverFieldErrors(fieldsError({ unknownField: ['Too long.'] }))).toEqual({
      unknownField: 'Too long.',
    });
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
      about: 'Phần giới thiệu dài quá 65.536 ký tự. Hãy xóa bớt 376 ký tự.',
    });
  });
});

describe('saveErrorText', () => {
  it('shows the lock text for the backend refusal, whose issue sits on a field the form lacks', () => {
    const refused = new ApiError('locked_in_official_contest', 403, 'Locked', {
      issues: [
        issue('officialMode', 'locked_in_official_contest', 'Locked in an official contest'),
      ],
    });
    expect(saveErrorText(refused)).toMatch(/^Chưa lưu được: kỳ thi chính thức/);
  });

  it('is null when the fields explain the failure, and when nothing failed', () => {
    expect(saveErrorText(fieldsError({ timezone: ['x'] }))).toBeNull();
    expect(saveErrorText(null)).toBeNull();
  });
});
